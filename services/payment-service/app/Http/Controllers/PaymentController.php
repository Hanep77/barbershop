<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\LedgerService;
use App\Services\XenditService;
use App\Support\BookingClient;
use App\Support\Outbox\EventPublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class PaymentController extends Controller
{
    public function __construct(
        private readonly XenditService $xendit,
        private readonly BookingClient $bookings,
        private readonly LedgerService $ledger,
    ) {
    }

    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_id' => ['required', 'integer'],
        ]);

        $booking = $this->bookings->find($validated['booking_id']);

        if (! $booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        $user = $request->user();

        if ((string) ($booking['user_id'] ?? '') !== (string) $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (($booking['status'] ?? null) !== 'pending') {
            return response()->json(['message' => 'Booking tidak valid'], 400);
        }

        $bookingId = (int) $booking['id'];

        $existing = Payment::query()->where('booking_id', $bookingId)->first();

        if ($existing && $existing->payment_url) {
            return response()->json(['payment_url' => $existing->payment_url]);
        }

        $amount = (float) ($booking['service_price'] ?? 0);

        if ($amount <= 0) {
            return response()->json(['message' => 'Service booking tidak valid.'], 422);
        }

        $frontendUrl = rtrim((string) (config('app.frontend_url') ?: env('FRONTEND_URL', config('app.url'))), '/');
        $redirectUrl = $frontendUrl.'/payment/return?booking_id='.$bookingId;
        $serviceName = $booking['service_name'] ?? data_get($booking, 'service.name');
        $description = 'Booking #'.$bookingId.($serviceName ? ' - '.$serviceName : '');

        try {
            $invoice = $this->xendit->createInvoice([
                'external_id' => 'booking-'.$bookingId,
                'amount' => $amount,
                'payer_email' => $booking['user_email'] ?? data_get($booking, 'user.email'),
                'description' => $description,
                'success_redirect_url' => $redirectUrl,
                'failure_redirect_url' => $redirectUrl,
                'currency' => 'IDR',
            ]);
        } catch (Throwable $e) {
            Log::error('Unable to create payment invoice', [
                'booking_id' => $bookingId,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Gagal membuat pembayaran. Silakan coba lagi.'], 502);
        }

        $payment = Payment::query()->updateOrCreate(
            ['booking_id' => $bookingId],
            [
                'user_id' => (string) ($booking['user_id'] ?? $user->id),
                'barbershop_id' => (string) ($booking['barbershop_id'] ?? data_get($booking, 'barbershop.id')),
                'barbershop_owner_id' => (string) ($booking['barbershop_owner_id'] ?? data_get($booking, 'barbershop.owner_id') ?? data_get($booking, 'barbershop.user_id')),
                'amount' => $amount,
                'status' => 'pending',
                'payment_method' => 'xendit',
                'payment_url' => $invoice['invoice_url'] ?? null,
                'transaction_id' => $invoice['id'] ?? null,
                'external_id' => $invoice['external_id'] ?? 'booking-'.$bookingId,
            ],
        );

        return response()->json(['payment_url' => $payment->payment_url]);
    }

    public function getByBooking(Request $request, string $bookingId): JsonResponse
    {
        $booking = $this->bookings->find($bookingId);

        if (! $booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if ((string) ($booking['user_id'] ?? '') !== (string) $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payment = Payment::query()->where('booking_id', (int) ($booking['id'] ?? $bookingId))->first();

        if (! $payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        return response()->json($payment);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $payment = Payment::query()->find($id);

        if (! $payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        if ((string) $payment->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($payment);
    }

    public function webhook(Request $request): JsonResponse
    {
        $webhookToken = (string) config('services.xendit.webhook_token');

        if ($webhookToken === '') {
            return response()->json(['message' => 'Webhook token is not configured'], 503);
        }

        if (! $this->xendit->verifyWebhookToken($request->header('x-callback-token'), $webhookToken)) {
            return response()->json(['message' => 'Invalid webhook token'], 401);
        }

        $data = json_decode((string) $request->getContent(), true);

        if (! is_array($data) || ! isset($data['external_id'])) {
            return response()->json(['message' => 'Invalid payload'], 400);
        }

        $externalId = (string) $data['external_id'];

        if (! str_starts_with($externalId, 'booking-')) {
            return response()->json(['message' => 'Webhook received and ignored'], 200);
        }

        $bookingId = substr($externalId, strlen('booking-'));
        $status = strtoupper((string) ($data['status'] ?? ''));

        $payment = Payment::query()->where('booking_id', $bookingId)->first();

        if (! $payment) {
            Log::warning('Payment webhook for unknown booking', ['booking_id' => $bookingId]);

            return response()->json(['message' => 'Payment record not found'], 200);
        }

        if ($payment->status === 'success') {
            return response()->json(['message' => 'Already processed'], 200);
        }

        if ($status === 'PAID') {
            DB::transaction(function () use ($payment, $data): void {
                $payment->update([
                    'status' => 'success',
                    'xendit_payment_id' => $data['payment_id'] ?? $payment->xendit_payment_id,
                    'transaction_id' => $data['id'] ?? $payment->transaction_id,
                ]);

                $this->ledger->credit(
                    (string) $payment->barbershop_id,
                    (float) $payment->amount,
                    'payment',
                    (string) $payment->id,
                    'payment:'.$payment->id,
                    'Booking payment',
                );

                EventPublisher::publish('PaymentSucceeded', [
                    'payment_id' => $payment->id,
                    'booking_id' => $payment->booking_id,
                    'user_id' => $payment->user_id,
                    'barbershop_id' => $payment->barbershop_id,
                    'barbershop_owner_id' => $payment->barbershop_owner_id,
                    'amount' => (float) $payment->amount,
                    'external_id' => $payment->external_id,
                ]);
            });

            Log::info('Payment webhook processed', [
                'payment_id' => $payment->id,
                'booking_id' => $payment->booking_id,
                'status' => 'success',
            ]);

            return response()->json(['message' => 'Webhook processed'], 200);
        }

        if (in_array($status, ['EXPIRED', 'FAILED'], true)) {
            DB::transaction(function () use ($payment, $data, $status): void {
                $payment->update(['status' => 'failed']);

                EventPublisher::publish('PaymentFailed', [
                    'payment_id' => $payment->id,
                    'booking_id' => $payment->booking_id,
                    'user_id' => $payment->user_id,
                    'barbershop_id' => $payment->barbershop_id,
                    'barbershop_owner_id' => $payment->barbershop_owner_id,
                    'amount' => (float) $payment->amount,
                    'reason' => $data['failure_reason'] ?? $status,
                ]);
            });

            Log::info('Payment webhook marked failed', [
                'payment_id' => $payment->id,
                'booking_id' => $payment->booking_id,
                'status' => $status,
            ]);

            return response()->json(['message' => 'Webhook processed'], 200);
        }

        return response()->json(['message' => 'Webhook received and ignored'], 200);
    }

    public function handleRefundWebhook(Request $request): JsonResponse
    {
        $webhookToken = (string) config('services.xendit.webhook_token');

        if ($webhookToken === '') {
            return response()->json(['message' => 'Webhook token is not configured'], 503);
        }

        if (! $this->xendit->verifyWebhookToken($request->header('x-callback-token'), $webhookToken)) {
            return response()->json(['message' => 'Invalid webhook token'], 401);
        }

        $data = json_decode((string) $request->getContent(), true);

        if (! is_array($data)) {
            return response()->json(['message' => 'Invalid payload'], 400);
        }

        $invoiceId = $data['invoice_id'] ?? $data['external_id'] ?? $data['id'] ?? null;
        $status = strtoupper((string) ($data['status'] ?? ''));

        if (! $invoiceId || $status === '') {
            return response()->json(['message' => 'Refund webhook received and ignored (test payload)'], 200);
        }

        $payment = Payment::query()
            ->where('transaction_id', $invoiceId)
            ->orWhere('external_id', $invoiceId)
            ->first();

        if (! $payment) {
            Log::warning('Refund webhook for unknown invoice', ['invoice_id' => $invoiceId]);

            return response()->json(['message' => 'Payment record not found'], 200);
        }

        $refundId = (string) ($data['refund_id'] ?? $data['id'] ?? '');
        $amount = (float) ($data['amount'] ?? $payment->refund_amount ?: $payment->amount);

        if (in_array($status, ['SUCCEEDED', 'COMPLETED', 'SUCCESS'], true)) {
            if ($payment->refund_status === 'success') {
                return response()->json(['message' => 'Already processed'], 200);
            }

            DB::transaction(function () use ($payment, $refundId, $amount): void {
                $payment->update([
                    'refund_status' => 'success',
                    'refund_amount' => $amount,
                    'refund_id' => $refundId ?: $payment->refund_id,
                ]);

                $suffix = $refundId !== '' ? $refundId : number_format($amount, 2, '.', '');

                $this->ledger->debit(
                    (string) $payment->barbershop_id,
                    $amount,
                    'refund',
                    (string) $payment->id,
                    'refund:'.$payment->id.':'.$suffix,
                    'Booking refund',
                );

                EventPublisher::publish('RefundSucceeded', [
                    'payment_id' => $payment->id,
                    'booking_id' => $payment->booking_id,
                    'barbershop_id' => $payment->barbershop_id,
                    'user_id' => $payment->user_id,
                    'amount' => $amount,
                    'refund_id' => $refundId ?: null,
                ]);
            });

            return response()->json(['message' => 'Refund webhook processed'], 200);
        }

        if (in_array($status, ['FAILED', 'REJECTED'], true)) {
            if ($payment->refund_status === 'failed') {
                return response()->json(['message' => 'Already processed'], 200);
            }

            DB::transaction(function () use ($payment, $refundId): void {
                $payment->update([
                    'refund_status' => 'failed',
                    'refund_id' => $refundId ?: $payment->refund_id,
                ]);

                EventPublisher::publish('RefundFailed', [
                    'payment_id' => $payment->id,
                    'booking_id' => $payment->booking_id,
                    'barbershop_id' => $payment->barbershop_id,
                    'refund_id' => $refundId ?: null,
                ]);
            });

            return response()->json(['message' => 'Refund webhook processed'], 200);
        }

        return response()->json(['message' => 'Refund webhook received and ignored'], 200);
    }
}
