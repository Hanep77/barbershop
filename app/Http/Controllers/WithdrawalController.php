<?php

namespace App\Http\Controllers;

use App\Http\Requests\WithdrawalRequest;
use App\Models\Withdrawal;
use App\Models\Barbershop;
use App\Services\NotificationService;
use App\Services\XenditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class WithdrawalController extends Controller
{
    protected $xenditService;

    private const XENDIT_FINAL_SUCCESS_STATUSES = ['SUCCEEDED', 'SUCCESS', 'COMPLETED'];
    private const XENDIT_FINAL_FAILED_STATUSES = ['FAILED', 'CANCELLED', 'REJECTED'];
    private const XENDIT_PENDING_STATUSES = ['ACCEPTED', 'PENDING', 'PROCESSING'];

    public function __construct(XenditService $xenditService)
    {
        $this->xenditService = $xenditService;
    }

    public function index(Request $request): JsonResponse
    {

        if (! $request->user()?->barbershop) {
            return response()->json([
                'message' => 'Barbershop tidak ditemukan',
            ], 404);
        }

        $withdrawals = Withdrawal::where('barbershop_id', $request->user()?->barbershop?->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Riwayat withdraw berhasil diambil',
            'data' => $withdrawals,
        ]);
    }

    public function store(WithdrawalRequest $request): JsonResponse
    {
        $barbershop = $request->user()?->barbershop;

        if (! $barbershop) {
            return response()->json([
                'message' => 'Barbershop tidak ditemukan',
            ], 404);
        }

        // Validasi: nominal withdraw harus positif
        $amount = (float) $request->amount;
        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Nominal withdraw harus lebih dari 0.',
            ]);
        }

        // Validasi: saldo harus cukup (termasuk pending withdrawal)
        $balance = (float) $barbershop->balance;
        $pendingWithdrawal = (float) $barbershop->withdrawals()
            ->where('status', 'pending')
            ->sum('amount');

        $availableBalance = $balance - $pendingWithdrawal;

        if ($availableBalance < $amount) {
            return response()->json([
                'message' => 'Saldo tidak mencukupi',
                'current_balance' => $balance,
                'pending_withdrawal' => $pendingWithdrawal,
                'available_balance' => max(0, $availableBalance),
                'requested_amount' => $amount,
            ], 422);
        }

        // Validasi bank code
        $bankCode = Withdrawal::getBankCode($request->bank_name);
        if (! $bankCode) {
            return response()->json([
                'message' => 'Bank tidak didukung. Gunakan: BCA, MANDIRI, BNI, BRI, CIMB, OCBC, PERMATA, DANAMON',
            ], 422);
        }

        $withdrawal = DB::transaction(function () use ($barbershop, $request, $amount, $bankCode) {
            // Generate external_id
            $externalId = 'withdrawal-' . uniqid();

            // Buat record withdrawal dengan status pending
            $withdrawal = $barbershop->withdrawals()->create([
                'amount' => $amount,
                'status' => 'pending',
                'bank_name' => $request->bank_name,
                'account_number' => $request->account_number,
                'account_name' => $request->account_name,
                'external_id' => $externalId,
            ]);

            // Siapkan payload untuk Xendit payout v2
            $payoutPayload = [
                'reference_id' => $externalId,
                'channel_code' => $bankCode,
                'channel_properties' => [
                    'account_number' => $request->account_number,
                    'account_holder_name' => $request->account_name,
                ],
                'amount' => (int) $amount,
                'description' => 'Withdrawal from ' . $barbershop->name,
                'currency' => 'IDR',
                'metadata' => [
                    'withdrawal_external_id' => $externalId,
                    'barbershop_id' => $barbershop->id,
                    'barbershop_name' => $barbershop->name,
                ],
            ];

            // Buat payout di Xendit
            try {
                $response = $this->xenditService->createPayout($payoutPayload, $externalId);

                // Simpan response dari Xendit
                $withdrawal->update([
                    'xendit_disbursement_id' => $response['id'] ?? null,
                    'xendit_status' => $response['status'] ?? 'pending',
                    'webhook_payload' => $response,
                ]);

                // Jika immediate success dari Xendit (jarang terjadi, tapi dimungkinkan)
                if (in_array($response['status'] ?? null, ['COMPLETED', 'succeeded', 'SUCCESS'])) {
                    $withdrawal->update(['status' => 'success', 'processed_at' => now()]);
                    $barbershop->decrement('balance', $amount);

                    NotificationService::send(
                        $barbershop->user,
                        'Withdraw Berhasil!',
                        "Withdraw sebesar IDR " . number_format($amount, 0, ',', '.') . " telah berhasil diproses.",
                        'withdraw_success'
                    );
                }
            } catch (\Exception $e) {
                Log::error('Xendit Payout Creation Failed', [
                    'error' => $e->getMessage(),
                    'withdrawal_id' => $withdrawal->id,
                    'amount' => $amount,
                ]);

                // Update withdrawal sebagai failed
                $withdrawal->update([
                    'status' => 'failed',
                    'failure_reason' => $e->getMessage(),
                    'processed_at' => now(),
                ]);

                NotificationService::send(
                    $barbershop->user,
                    'Withdraw Gagal',
                    "Withdraw sebesar IDR " . number_format($amount, 0, ',', '.') . " gagal diproses: " . $e->getMessage(),
                    'withdraw_failed'
                );
            }

            return $withdrawal->fresh();
        });

        if ($withdrawal->status === 'success') {
            return response()->json([
                'message' => 'Withdraw berhasil diproses',
                'data' => $withdrawal,
                'status' => 'success',
            ], 201);
        } elseif ($withdrawal->status === 'failed') {
            return response()->json([
                'message' => 'Withdraw gagal diproses',
                'data' => $withdrawal,
                'status' => 'failed',
            ], 400);
        } else {
            // Status pending - menunggu webhook dari Xendit
            return response()->json([
                'message' => 'Withdrawal sedang diproses',
                'data' => $withdrawal,
                'status' => 'pending',
            ], 201);
        }
    }

    public function updateBalanceViaWebhook(Request $request)
    {
        $payload = $request->all();
        $callbackToken = $request->header('x-callback-token') ?? $request->header('X-CALLBACK-TOKEN');
        $expectedToken = config('services.xendit.webhook_token');

        Log::info('Received Xendit Withdrawal Webhook', [
            'reference_id' => data_get($payload, 'data.reference_id', data_get($payload, 'reference_id')),
            'has_data_wrapper' => array_key_exists('data', $payload),
        ]);

        if (! $expectedToken || ! $callbackToken || ! hash_equals($expectedToken, $callbackToken)) {
            Log::warning('Invalid Xendit Withdrawal Webhook token', [
                'token_present' => (bool) $callbackToken,
                'token_valid' => false,
            ]);

            return response()->json(['message' => 'Invalid webhook token'], 403);
        }

        Log::info('Xendit Withdrawal Webhook token validated', [
            'token_present' => true,
            'token_valid' => true,
        ]);

        $payout = $payload['data'] ?? $payload;
        $status = strtoupper((string) ($payout['status'] ?? ''));
        $referenceId = $payout['reference_id'] ?? null;
        $metadataExternalId = data_get($payout, 'metadata.withdrawal_external_id');
        $payoutId = $payout['id'] ?? null;

        $withdrawal = $this->findWithdrawalForWebhook($referenceId, $metadataExternalId, $payoutId);

        Log::info('Xendit Withdrawal Webhook lookup result', [
            'reference_id' => $referenceId,
            'withdrawal_found' => (bool) $withdrawal,
            'status' => $status,
        ]);

        if (! $withdrawal) {
            return response()->json(['message' => 'Withdrawal not found'], 404);
        }

        $responseMessage = 'Webhook processed';

        DB::transaction(function () use ($withdrawal, $payout, $status, &$responseMessage) {
            $withdrawal = Withdrawal::where('id', $withdrawal->id)->lockForUpdate()->first();

            if (! $withdrawal) {
                $responseMessage = 'Withdrawal not found';
                return;
            }

            $barbershop = Barbershop::where('id', $withdrawal->barbershop_id)->lockForUpdate()->first();

            if (! $barbershop) {
                Log::warning('Barbershop not found for withdrawal webhook', [
                    'withdrawal_id' => $withdrawal->id,
                    'barbershop_id' => $withdrawal->barbershop_id,
                ]);

                $responseMessage = 'Barbershop not found';
                return;
            }

            $previousStatus = $withdrawal->status;
            $finalStatus = null;
            $failureReason = data_get($payout, 'failure_reason') ?? data_get($payout, 'failure_message');
            $failureCode = data_get($payout, 'failure_code');

            if (in_array($status, self::XENDIT_FINAL_SUCCESS_STATUSES, true)) {
                $finalStatus = 'success';
            } elseif (in_array($status, self::XENDIT_FINAL_FAILED_STATUSES, true)) {
                $finalStatus = 'failed';
            } elseif (in_array($status, self::XENDIT_PENDING_STATUSES, true)) {
                $finalStatus = 'pending';
            }

            Log::info('Xendit Withdrawal Webhook status transition', [
                'withdrawal_id' => $withdrawal->id,
                'previous_status' => $previousStatus,
                'new_status' => $finalStatus,
            ]);

            if ($finalStatus === 'success') {
                if ($previousStatus === 'success') {
                    Log::info('Xendit Withdrawal Webhook already processed', [
                        'withdrawal_id' => $withdrawal->id,
                    ]);

                    $responseMessage = 'Webhook already processed';
                    return;
                }

                $balanceBefore = (float) $barbershop->balance;

                $withdrawal->update([
                    'status' => 'success',
                    'xendit_status' => $status,
                    'processed_at' => now(),
                    'webhook_payload' => $payout,
                ]);

                $barbershop->decrement('balance', $withdrawal->amount);
                $barbershop->refresh();

                Log::info('Xendit Withdrawal Webhook balance updated', [
                    'withdrawal_id' => $withdrawal->id,
                    'balance_before' => $balanceBefore,
                    'balance_after' => (float) $barbershop->balance,
                ]);

                NotificationService::send(
                    $barbershop->user,
                    'Withdraw Berhasil!',
                    'Withdraw sebesar IDR ' . number_format($withdrawal->amount, 0, ',', '.') . ' telah berhasil diproses.',
                    'withdraw_success'
                );

                $responseMessage = 'Withdrawal marked as success';
                return;
            }

            if ($finalStatus === 'failed') {
                if ($previousStatus === 'failed') {
                    Log::info('Xendit Withdrawal Webhook already processed', [
                        'withdrawal_id' => $withdrawal->id,
                    ]);

                    $responseMessage = 'Webhook already processed';
                    return;
                }

                $withdrawal->update([
                    'status' => 'failed',
                    'xendit_status' => $status,
                    'failure_code' => $failureCode,
                    'failure_reason' => $failureReason ?: 'Xendit status: ' . $status,
                    'processed_at' => now(),
                    'webhook_payload' => $payout,
                ]);

                NotificationService::send(
                    $barbershop->user,
                    'Withdraw Gagal',
                    'Withdraw sebesar IDR ' . number_format($withdrawal->amount, 0, ',', '.') . ' gagal diproses. Status dari Xendit: ' . $status,
                    'withdraw_failed'
                );

                $responseMessage = 'Withdrawal marked as failed';
                return;
            }

            $withdrawal->update([
                'xendit_status' => $status ?: $withdrawal->xendit_status,
                'webhook_payload' => $payout,
            ]);

            $responseMessage = 'Withdrawal kept pending';
        });

        return response()->json(['message' => $responseMessage], 200);
    }

    private function findWithdrawalForWebhook(?string $referenceId, ?string $metadataExternalId, ?string $payoutId): ?Withdrawal
    {
        if ($referenceId) {
            $withdrawal = Withdrawal::where('external_id', $referenceId)->first();

            if ($withdrawal) {
                return $withdrawal;
            }
        }

        if ($metadataExternalId) {
            $withdrawal = Withdrawal::where('external_id', $metadataExternalId)->first();

            if ($withdrawal) {
                return $withdrawal;
            }
        }

        if ($payoutId) {
            return Withdrawal::where('xendit_disbursement_id', $payoutId)->first();
        }

        return null;
    }
}
