<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use App\Services\XenditService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    protected $xenditService;

    public function __construct(XenditService $xenditService)
    {
        $this->xenditService = $xenditService;
    }

    public function show($id)
    {
        $payment = Payment::with('booking')->findOrFail($id);

        return response()->json($payment);
    }

    public function getByBooking(Request $request, string $bookingId)
    {
        $booking = Booking::findOrFail($bookingId);

        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payment = Payment::where('booking_id', $booking->id)->first();

        if (!$payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        return response()->json($payment);
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => ['required', 'exists:bookings,id'],
        ]);

        $booking = Booking::with(['user', 'service', 'barbershop'])->findOrFail($validated['booking_id']);

        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($booking->status !== 'pending') {
            return response()->json(['message' => 'Booking tidak valid'], 400);
        }

        $existingPayment = Payment::where('booking_id', $booking->id)->first();

        if ($existingPayment && $existingPayment->payment_url) {
            return response()->json(['payment_url' => $existingPayment->payment_url]);
        }

        $amount = $booking->service?->price;

        if (!$amount) {
            throw ValidationException::withMessages([
                'booking_id' => 'Service booking tidak valid.',
            ]);
        }

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', config('app.url'))), '/');

        $invoice = $this->xenditService->createInvoice([
            'external_id' => 'booking-' . $booking->id,
            'amount' => $amount,
            'payer_email' => $booking->user->email,
            'description' => 'Booking #' . $booking->id . ' - ' . $booking->service->name,
            'success_redirect_url' => $frontendUrl . '/payment/return?booking_id=' . $booking->id,
            'failure_redirect_url' => $frontendUrl . '/payment/return?booking_id=' . $booking->id,
            'currency' => 'IDR',
        ]);

        $payment = Payment::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'amount' => $amount,
                'status' => 'pending',
                'transaction_id' => $invoice['id'] ?? null,
                'external_id' => $invoice['external_id'] ?? null,
                'payment_method' => 'xendit',
                'payment_url' => $invoice['invoice_url'] ?? null,
            ]
        );

        return response()->json([
            'payment_url' => $payment->payment_url,
        ]);
    }

    public function webhook(Request $request)
    {
        $payload = $request->getContent();
        $callbackToken = $request->header('x-callback-token');
        $webhookToken = config('services.xendit.webhook_token');
        $payment = Payment::where('external_id', $request->external_id)->first();

        if (!$payment) {
            return response()->json(['message' => 'invalid_external_id'], 400);
        }

        Log::info('Webhook Received', ['payload' => $payload]);

        if ($webhookToken && !$this->xenditService->verifyWebhookToken($callbackToken, $webhookToken)) {
            Log::warning('Invalid Webhook Token');
            return response()->json(['error' => 'Invalid webhook token'], 401);
        }

        $data = json_decode($payload, true);

        if (!$data || !isset($data['external_id'])) {
            Log::warning('Invalid Webhook Payload');
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        $externalId = $data['external_id'];
        $status = $data['status'] ?? null;

        if (!str_starts_with($externalId, 'booking-')) {
            return response()->json(['error' => 'Invalid external_id'], 400);
        }

        $bookingId = str_replace('booking-', '', $externalId);
        $payment = Payment::where('booking_id', $bookingId)->first();
        if (!$payment) {
            Log::warning('Payment Not Found', ['booking_id' => $bookingId]);
            return response()->json(['error' => 'Payment not found'], 404);
        }

        // Idempotency: Check if already processed
        if ($payment->status === 'success') {
            Log::info('Webhook Already Processed', ['booking_id' => $bookingId, 'status' => $payment->status]);
            return response()->json(['message' => 'Already processed'], 200);
        }

        DB::beginTransaction();
        try {
            $booking = Booking::with('barbershop')->findOrFail($bookingId);

            if ($status === 'PAID') {
                $payment->update(['status' => 'success']);
                $booking->update(['status' => 'confirmed']);

                $booking->barbershop->increment('balance', $payment->amount);

                // Notify customer about successful payment
                $booking->load(['user', 'barbershop', 'service']);
                NotificationService::notifyPaymentStatus($payment, 'success');

                Log::info('Payment Success', ['booking_id' => $booking->id]);
            } elseif (in_array($status, ['EXPIRED', 'FAILED'])) {
                $payment->update(['status' => 'failed']);
                $booking->update(['status' => 'cancelled']);

                // Notify customer about failed payment
                $booking->load(['user', 'barbershop', 'service']);
                NotificationService::notifyPaymentStatus($payment, 'failed');

                Log::info('Payment Failed', ['booking_id' => $bookingId, 'status' => $status]);
            }

            DB::commit();
            return response()->json(['message' => 'Webhook processed'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Webhook Processing Failed', ['error' => $e->getMessage(), 'booking_id' => $bookingId]);
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }

    public function handleRefundWebhook(Request $request)
    {
        $payload = $request->getContent();
        $callbackToken = $request->header('x-callback-token');
        $webhookToken = config('services.xendit.webhook_token');

        Log::info('Refund Webhook Received', ['payload' => $payload]);

        // Validasi webhook token
        if ($webhookToken && !$this->xenditService->verifyWebhookToken($callbackToken, $webhookToken)) {
            Log::warning('Invalid Refund Webhook Token');
            return response()->json(['error' => 'Invalid webhook token'], 401);
        }

        $data = json_decode($payload, true);

        if (!$data) {
            Log::warning('Invalid Refund Webhook Payload');
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        // Ambil invoice_id dari webhook data
        // Xendit refund webhook biasanya mengirim: invoice_id, refund_id, status
        $invoiceId = $data['invoice_id'] ?? $data['reference_id'] ?? null;
        $refundStatus = $data['status'] ?? null;

        if (!$invoiceId || !$refundStatus) {
            Log::warning('Missing refund data in webhook', ['data' => $data]);
            return response()->json(['error' => 'Missing required fields'], 400);
        }

        DB::beginTransaction();
        try {
            // Cari payment berdasarkan transaction_id (invoice_id dari Xendit)
            $payment = Payment::where('transaction_id', $invoiceId)->first();

            if (!$payment) {
                Log::warning('Payment Not Found for Refund', ['invoice_id' => $invoiceId]);
                DB::rollBack();
                return response()->json(['error' => 'Payment not found'], 404);
            }

            $booking = $payment->booking;

            if (!$booking) {
                Log::warning('Booking Not Found for Payment', ['payment_id' => $payment->id]);
                DB::rollBack();
                return response()->json(['error' => 'Booking not found'], 404);
            }

            // Handle berdasarkan status refund dari Xendit
            if ($refundStatus === 'SUCCEEDED' || $refundStatus === 'success') {
                // Refund sukses: update refund_status dan kurangi saldo barbershop
                $booking->update(['refund_status' => 'success']);
                $booking->barbershop->decrement('balance', $booking->refund_amount);

                Log::info('Refund Success', [
                    'booking_id' => $booking->id,
                    'refund_amount' => $booking->refund_amount,
                    'invoice_id' => $invoiceId
                ]);
            } elseif (in_array($refundStatus, ['FAILED', 'REJECTED', 'failed'])) {
                // Refund gagal: update refund_status
                $booking->update(['refund_status' => 'failed']);

                Log::info('Refund Failed', [
                    'booking_id' => $booking->id,
                    'status' => $refundStatus,
                    'invoice_id' => $invoiceId
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Refund webhook processed'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Refund Webhook Processing Failed', [
                'error' => $e->getMessage(),
                'invoice_id' => $invoiceId
            ]);
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }
}
