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

    public function __construct(XenditService $xenditService)
    {
        $this->xenditService = $xenditService;
    }

    public function index(Request $request): JsonResponse
    {
        $barbershop = $request->user()?->barbershop;

        $barbershop->load('withdrawals');

        if (! $barbershop) {
            return response()->json([
                'message' => 'Barbershop tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'message' => 'Riwayat withdraw berhasil diambil',
            'data' => $barbershop,
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

            // Siapkan payload untuk Xendit payout
            $payoutPayload = [
                'reference_id' => $externalId,
                'currency' => 'IDR',
                'amount' => (int) $amount,
                'bank_code' => $bankCode,
                'account_holder_name' => $request->account_name,
                'account_number' => $request->account_number,
                'description' => 'Withdrawal from ' . $barbershop->name,
            ];

            // Buat payout di Xendit
            try {
                $response = $this->xenditService->createPayout($payoutPayload);

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
}
