<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\BalanceService;
use App\Services\XenditService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class InternalPaymentController extends Controller
{
    public function __construct(
        private readonly XenditService $xendit,
        private readonly BalanceService $balances,
    ) {
    }

    public function byBooking(string $bookingId): JsonResponse
    {
        $payment = Payment::query()->where('booking_id', $bookingId)->first();

        if (! $payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        return response()->json(['payment' => $payment]);
    }

    public function byBookings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_ids' => ['required', 'array'],
            'booking_ids.*' => ['required'],
        ]);

        $payments = Payment::query()
            ->whereIn('booking_id', $validated['booking_ids'])
            ->get()
            ->keyBy('booking_id');

        return response()->json(['payments' => $payments]);
    }

    public function refund(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_id' => ['required'],
            'amount' => ['nullable', 'numeric', 'gt:0'],
            'reason' => ['nullable', 'string'],
        ]);

        $payment = Payment::query()->where('booking_id', $validated['booking_id'])->first();

        if (! $payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        $amount = (float) ($validated['amount'] ?? $payment->amount);

        // Claim the refund atomically so concurrent cancellation requests do
        // not issue duplicate Xendit refunds.
        $claimed = DB::transaction(function () use ($payment, $amount): bool {
            $locked = Payment::query()->whereKey($payment->id)->lockForUpdate()->first();

            if (! $locked) {
                return false;
            }

            if (in_array($locked->refund_status, ['pending', 'success'], true)) {
                return false;
            }

            if ($locked->status !== 'success') {
                return false;
            }

            $locked->update([
                'refund_status' => 'pending',
                'refund_amount' => $amount,
            ]);

            return true;
        });

        $payment->refresh();

        if (! $claimed) {
            return response()->json([
                'refund_status' => $payment->refund_status,
                'refund_amount' => (float) $payment->refund_amount,
            ]);
        }

        if ($payment->status !== 'success') {
            return response()->json([
                'refund_status' => 'none',
                'refund_amount' => 0,
            ]);
        }

        try {
            $response = $this->xendit->refundInvoice(
                (string) $payment->transaction_id,
                $amount,
                $payment->xendit_payment_id,
            );

            $status = strtoupper((string) ($response['status'] ?? ''));
            $accepted = ! isset($response['error_code'])
                && ! in_array($status, ['FAILED', 'REJECTED'], true);

            if ($accepted) {
                $payment->update(['refund_id' => $response['id'] ?? null]);
            } else {
                $payment->update(['refund_status' => 'failed']);
            }
        } catch (Throwable) {
            $payment->update(['refund_status' => 'failed']);
        }

        $payment->refresh();

        return response()->json([
            'refund_status' => $payment->refund_status,
            'refund_amount' => (float) $payment->refund_amount,
        ]);
    }

    public function stats(Request $request, string $barbershopId): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $base = Payment::query()
            ->where('barbershop_id', $barbershopId)
            ->where('status', 'success');

        $revenue = (float) (clone $base)
            ->when($validated['from'] ?? null, fn ($q, $from) => $q->where('created_at', '>=', Carbon::parse($from)->startOfDay()))
            ->when($validated['to'] ?? null, fn ($q, $to) => $q->where('created_at', '<=', Carbon::parse($to)->endOfDay()))
            ->sum('amount');

        $currentMonth = (float) (clone $base)
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->sum('amount');

        $lastMonth = (float) (clone $base)
            ->whereBetween('created_at', [
                now()->subMonthNoOverflow()->startOfMonth(),
                now()->subMonthNoOverflow()->endOfMonth(),
            ])
            ->sum('amount');

        $change = $lastMonth > 0
            ? round((($currentMonth - $lastMonth) / $lastMonth) * 100, 2)
            : ($currentMonth > 0 ? 100.0 : 0.0);

        return response()->json([
            'revenue' => round($revenue, 2),
            'current_month' => round($currentMonth, 2),
            'last_month' => round($lastMonth, 2),
            'revenue_change' => $change,
        ]);
    }

    public function balance(string $barbershopId): JsonResponse
    {
        return response()->json($this->balances->summary($barbershopId));
    }
}
