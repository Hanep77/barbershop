<?php

namespace App\Http\Controllers;

use App\Models\Withdrawal;
use App\Services\BalanceService;
use App\Services\LedgerService;
use App\Services\XenditService;
use App\Support\BarbershopResolver;
use App\Support\Outbox\EventPublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

class WithdrawalController extends Controller
{
    private const SUCCESS_STATUSES = ['SUCCEEDED', 'SUCCESS', 'COMPLETED'];

    private const FAILED_STATUSES = ['FAILED', 'CANCELLED', 'REJECTED'];

    public function __construct(
        private readonly XenditService $xendit,
        private readonly BarbershopResolver $shops,
        private readonly BalanceService $balances,
        private readonly LedgerService $ledger,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $shop = $this->shops->byOwner((string) $request->user()->id);

        if (! $shop) {
            return response()->json(['message' => 'Barbershop tidak ditemukan'], 404);
        }

        $withdrawals = Withdrawal::query()
            ->where('barbershop_id', (string) $shop['id'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'message' => 'Riwayat withdraw berhasil diambil',
            'data' => $withdrawals,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $shop = $this->shops->byOwner((string) $request->user()->id);

        if (! $shop) {
            return response()->json(['message' => 'Barbershop tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'amount' => ['required', 'numeric', 'gt:0'],
            'bank_name' => ['required', 'string'],
            'account_name' => ['required', 'string'],
            'account_number' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Data withdraw tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $amount = (float) $request->input('amount');
        $bankName = (string) $request->input('bank_name');
        $bankCode = Withdrawal::getBankCode($bankName);

        if (! $bankCode) {
            return response()->json([
                'message' => 'Bank tidak didukung. Gunakan: BCA, MANDIRI, BNI, BRI, CIMB, OCBC, PERMATA, DANAMON',
            ], 422);
        }

        $barbershopId = (string) $shop['id'];
        $summary = $this->balances->summary($barbershopId);

        if ($summary['available_balance'] < $amount) {
            return response()->json([
                'message' => 'Saldo tidak mencukupi',
                'current_balance' => $summary['balance'],
                'pending_withdrawal' => $summary['pending_withdrawal'],
                'available_balance' => $summary['available_balance'],
                'requested_amount' => $amount,
            ], 422);
        }

        $externalId = 'withdrawal-'.uniqid();

        // Re-check the balance while holding the projection and pending rows
        // locked so two concurrent requests cannot over-withdraw.
        $result = DB::transaction(function () use ($barbershopId, $amount, $bankName, $request, $externalId): array {
            $projection = \App\Models\BarbershopBalance::query()
                ->where('barbershop_id', $barbershopId)
                ->lockForUpdate()
                ->first();

            $pending = (float) Withdrawal::query()
                ->where('barbershop_id', $barbershopId)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->sum('amount');

            $available = round((float) ($projection?->balance ?? 0) - $pending, 2);

            if ($available < $amount) {
                return [
                    'ok' => false,
                    'summary' => [
                        'balance' => round((float) ($projection?->balance ?? 0), 2),
                        'pending_withdrawal' => round($pending, 2),
                        'available_balance' => max(0, $available),
                    ],
                ];
            }

            return [
                'ok' => true,
                'withdrawal' => Withdrawal::query()->create([
                    'barbershop_id' => $barbershopId,
                    'barbershop_owner_id' => (string) $request->user()->id,
                    'amount' => $amount,
                    'status' => 'pending',
                    'bank_name' => $bankName,
                    'account_name' => (string) $request->input('account_name'),
                    'account_number' => (string) $request->input('account_number'),
                    'external_id' => $externalId,
                ]),
            ];
        });

        if (! $result['ok']) {
            return response()->json([
                'message' => 'Saldo tidak mencukupi',
                'current_balance' => $result['summary']['balance'],
                'pending_withdrawal' => $result['summary']['pending_withdrawal'],
                'available_balance' => $result['summary']['available_balance'],
                'requested_amount' => $amount,
            ], 422);
        }

        /** @var Withdrawal $withdrawal */
        $withdrawal = $result['withdrawal'];

        $payoutPayload = [
            'reference_id' => $externalId,
            'channel_code' => $bankCode,
            'channel_properties' => [
                'account_number' => (string) $request->input('account_number'),
                'account_holder_name' => (string) $request->input('account_name'),
            ],
            'amount' => (int) $amount,
            'description' => 'Withdrawal from '.($shop['name'] ?? 'Barbershop'),
            'currency' => 'IDR',
            'metadata' => [
                'withdrawal_external_id' => $externalId,
                'barbershop_id' => $barbershopId,
                'barbershop_name' => $shop['name'] ?? null,
            ],
        ];

        try {
            $response = $this->xendit->createPayout($payoutPayload, $externalId);
        } catch (Throwable $e) {
            Log::error('Xendit payout creation failed', [
                'withdrawal_id' => $withdrawal->id,
                'external_id' => $externalId,
                'error' => $e->getMessage(),
            ]);

            $this->markFailed($withdrawal, $e->getMessage());

            return response()->json([
                'message' => 'Withdraw gagal diproses',
                'data' => $withdrawal->fresh(),
                'status' => 'failed',
            ], 400);
        }

        $xenditStatus = (string) ($response['status'] ?? 'PENDING');

        $withdrawal->update([
            'xendit_disbursement_id' => $response['id'] ?? null,
            'xendit_status' => $xenditStatus,
            'webhook_payload' => $response,
        ]);

        if (in_array(strtoupper($xenditStatus), self::SUCCESS_STATUSES, true)) {
            $this->markSucceeded($withdrawal);

            return response()->json([
                'message' => 'Withdraw berhasil diproses',
                'data' => $withdrawal->fresh(),
                'status' => 'success',
            ], 201);
        }

        return response()->json([
            'message' => 'Withdrawal sedang diproses',
            'data' => $withdrawal->fresh(),
            'status' => 'pending',
        ], 201);
    }

    public function updateBalanceViaWebhook(Request $request): JsonResponse
    {
        $webhookToken = (string) config('services.xendit.webhook_token');

        if ($webhookToken === '') {
            return response()->json(['message' => 'Webhook token is not configured'], 503);
        }

        if (! $this->xendit->verifyWebhookToken($request->header('x-callback-token'), $webhookToken)) {
            return response()->json(['message' => 'Invalid webhook token'], 403);
        }

        $payload = $request->all();
        $payout = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;

        $status = strtoupper((string) ($payout['status'] ?? ''));
        $referenceId = $payout['reference_id'] ?? null;
        $metadataExternalId = data_get($payout, 'metadata.withdrawal_external_id');
        $payoutId = $payout['id'] ?? null;

        $withdrawal = $this->findWithdrawalForWebhook($referenceId, $metadataExternalId, $payoutId);

        if (! $withdrawal) {
            return response()->json(['message' => 'Withdrawal not found'], 404);
        }

        if (in_array($withdrawal->status, ['success', 'failed'], true)) {
            return response()->json(['message' => 'Already processed'], 200);
        }

        if (in_array($status, self::SUCCESS_STATUSES, true)) {
            DB::transaction(function () use ($withdrawal, $payout, $status): void {
                $withdrawal->update([
                    'status' => 'success',
                    'xendit_status' => $status,
                    'processed_at' => now(),
                    'webhook_payload' => $payout,
                ]);

                $this->ledger->debit(
                    (string) $withdrawal->barbershop_id,
                    (float) $withdrawal->amount,
                    'withdrawal',
                    (string) $withdrawal->id,
                    'withdrawal:'.$withdrawal->id,
                    'Partner withdrawal',
                );

                EventPublisher::publish('WithdrawalSucceeded', [
                    'withdrawal_id' => $withdrawal->id,
                    'barbershop_id' => $withdrawal->barbershop_id,
                    'barbershop_owner_id' => $withdrawal->barbershop_owner_id,
                    'amount' => (float) $withdrawal->amount,
                    'external_id' => $withdrawal->external_id,
                ]);
            });

            Log::info('Withdrawal webhook succeeded', ['withdrawal_id' => $withdrawal->id]);

            return response()->json(['message' => 'Withdrawal marked as success'], 200);
        }

        if (in_array($status, self::FAILED_STATUSES, true)) {
            $reason = data_get($payout, 'failure_reason') ?? data_get($payout, 'failure_message') ?? 'Xendit status: '.$status;

            DB::transaction(function () use ($withdrawal, $payout, $status, $reason): void {
                $withdrawal->update([
                    'status' => 'failed',
                    'xendit_status' => $status,
                    'failure_code' => data_get($payout, 'failure_code'),
                    'failure_reason' => $reason,
                    'processed_at' => now(),
                    'webhook_payload' => $payout,
                ]);

                EventPublisher::publish('WithdrawalFailed', [
                    'withdrawal_id' => $withdrawal->id,
                    'barbershop_id' => $withdrawal->barbershop_id,
                    'barbershop_owner_id' => $withdrawal->barbershop_owner_id,
                    'amount' => (float) $withdrawal->amount,
                    'external_id' => $withdrawal->external_id,
                    'reason' => $reason,
                ]);
            });

            Log::info('Withdrawal webhook failed', ['withdrawal_id' => $withdrawal->id]);

            return response()->json(['message' => 'Withdrawal marked as failed'], 200);
        }

        $withdrawal->update([
            'xendit_status' => $status ?: $withdrawal->xendit_status,
            'webhook_payload' => $payout,
        ]);

        return response()->json(['message' => 'Withdrawal kept pending'], 200);
    }

    private function markSucceeded(Withdrawal $withdrawal): void
    {
        DB::transaction(function () use ($withdrawal): void {
            $withdrawal->update([
                'status' => 'success',
                'processed_at' => now(),
            ]);

            $this->ledger->debit(
                (string) $withdrawal->barbershop_id,
                (float) $withdrawal->amount,
                'withdrawal',
                (string) $withdrawal->id,
                'withdrawal:'.$withdrawal->id,
                'Partner withdrawal',
            );

            EventPublisher::publish('WithdrawalSucceeded', [
                'withdrawal_id' => $withdrawal->id,
                'barbershop_id' => $withdrawal->barbershop_id,
                'barbershop_owner_id' => $withdrawal->barbershop_owner_id,
                'amount' => (float) $withdrawal->amount,
                'external_id' => $withdrawal->external_id,
            ]);
        });
    }

    private function markFailed(Withdrawal $withdrawal, string $reason): void
    {
        DB::transaction(function () use ($withdrawal, $reason): void {
            $withdrawal->update([
                'status' => 'failed',
                'failure_reason' => $reason,
                'processed_at' => now(),
            ]);

            EventPublisher::publish('WithdrawalFailed', [
                'withdrawal_id' => $withdrawal->id,
                'barbershop_id' => $withdrawal->barbershop_id,
                'barbershop_owner_id' => $withdrawal->barbershop_owner_id,
                'amount' => (float) $withdrawal->amount,
                'external_id' => $withdrawal->external_id,
                'reason' => $reason,
            ]);
        });
    }

    private function findWithdrawalForWebhook(?string $referenceId, ?string $metadataExternalId, ?string $payoutId): ?Withdrawal
    {
        if ($referenceId) {
            $withdrawal = Withdrawal::query()->where('external_id', $referenceId)->first();

            if ($withdrawal) {
                return $withdrawal;
            }
        }

        if ($metadataExternalId) {
            $withdrawal = Withdrawal::query()->where('external_id', $metadataExternalId)->first();

            if ($withdrawal) {
                return $withdrawal;
            }
        }

        if ($payoutId) {
            return Withdrawal::query()->where('xendit_disbursement_id', $payoutId)->first();
        }

        return null;
    }
}
