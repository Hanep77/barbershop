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

        Log::info('--- Xendit Webhook Start ---');
        Log::info('Payload: ' . $payload);
        Log::info('Callback Token: ' . ($callbackToken ?? 'MISSING'));
        Log::info('Configured Webhook Token: ' . ($webhookToken ?? 'NOT CONFIGURED'));

        if ($webhookToken && !$this->xenditService->verifyWebhookToken($callbackToken, $webhookToken)) {
            Log::warning('Xendit Webhook Token Mismatch!');
            return response()->json(['error' => 'Invalid webhook token'], 401);
        }

        $data = json_decode($payload, true);
        if (!$data || !isset($data['external_id'])) {
            Log::warning('Invalid Webhook Payload Structure');
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        $externalId = $data['external_id'];
        $status = $data['status'] ?? null;

        Log::info("Processing Webhook for External ID: $externalId, Status: $status");

        if (!str_starts_with($externalId, 'booking-')) {
            Log::info('Webhook Ignored: Not a booking payment (possibly test or generic invoice)');
            return response()->json(['message' => 'Webhook received and ignored'], 200);
        }

        $bookingId = str_replace('booking-', '', $externalId);
        $payment = Payment::where('booking_id', $bookingId)->first();
        
        if (!$payment) {
            Log::error("Payment Record Not Found in Database for Booking ID: $bookingId");
            // We return 200 to acknowledge receipt to Xendit even if we can't find the record
            return response()->json(['message' => 'Payment record not found'], 200);
        }

        if ($payment->status === 'success') {
            Log::info("Payment already processed as SUCCESS for Booking ID: $bookingId");
            return response()->json(['message' => 'Already processed'], 200);
        }

        DB::beginTransaction();
        try {
            $booking = Booking::with('barbershop')->find($bookingId);
            
            if (!$booking) {
                Log::error("Booking Record Not Found in Database for ID: $bookingId");
                DB::rollBack();
                return response()->json(['message' => 'Booking not found'], 200);
            }

            if ($status === 'PAID') {
                Log::info("Updating status to SUCCESS for Booking: $bookingId");
                
                // Save payment_id for refund purposes
                $xenditPaymentId = $data['payment_id'] ?? null;
                $payment->update([
                    'status' => 'success',
                    'xendit_payment_id' => $xenditPaymentId
                ]);
                $booking->update(['status' => 'confirmed']);

                if ($booking->barbershop) {
                    $booking->barbershop->increment('balance', $payment->amount);
                    Log::info("Balance updated for Barbershop ID: " . $booking->barbershop->id);
                } else {
                    Log::warning("No Barbershop relationship found for Booking: $bookingId. Balance not updated.");
                }

                $booking->load(['user', 'barbershop', 'service']);
                try {
                    NotificationService::notifyPaymentStatus($payment, 'success');
                    Log::info('Payment notification sent');
                } catch (\Exception $notifyEx) {
                    Log::warning('Notification failed but payment was successful: ' . $notifyEx->getMessage());
                }
            } elseif (in_array($status, ['EXPIRED', 'FAILED'])) {
                Log::info("Updating status to FAILED/CANCELLED for Booking: $bookingId. Xendit Status: $status");
                $payment->update(['status' => 'failed']);
                $booking->update(['status' => 'cancelled']);
                
                $booking->load(['user', 'barbershop', 'service']);
                NotificationService::notifyPaymentStatus($payment, 'failed');
            } else {
                Log::info("Unhandled Xendit status: $status for Booking: $bookingId");
            }

            DB::commit();
            Log::info('--- Xendit Webhook Finished Successfully ---');
            return response()->json(['message' => 'Webhook processed'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Webhook Processing Error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function handleRefundWebhook(Request $request)
    {
        $payload = $request->getContent();
        $callbackToken = $request->header('x-callback-token');
        $webhookToken = config('services.xendit.webhook_token');

        Log::info('--- Xendit Refund Webhook Received ---', ['payload' => $payload]);

        // Validasi webhook token
        if ($webhookToken && !$this->xenditService->verifyWebhookToken($callbackToken, $webhookToken)) {
            Log::warning('Invalid Refund Webhook Token');
            return response()->json(['error' => 'Invalid webhook token'], 401);
        }

        $data = json_decode($payload, true);

        if (!$data) {
            Log::warning('Invalid Refund Webhook Payload (Empty or not JSON)');
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        // Ambil invoice_id dari webhook data
        // Xendit refund webhook biasanya mengirim: invoice_id, refund_id, status
        $invoiceId = $data['invoice_id'] ?? $data['external_id'] ?? $data['id'] ?? null;
        $refundStatus = $data['status'] ?? null;
        $refundAmount = $data['amount'] ?? 0;

        Log::info("Processing Refund Webhook: Invoice $invoiceId, Status $refundStatus, Amount $refundAmount");

        // Jika data tidak lengkap (biasanya saat Test and Save), kita tetap kembalikan 200 agar bisa disimpan
        if (!$invoiceId || !$refundStatus) {
            Log::info('Refund Webhook Ignored: Missing required fields (likely a test payload)');
            return response()->json(['message' => 'Refund webhook received and ignored (test payload)'], 200);
        }

        DB::beginTransaction();
        try {
            // Cari payment berdasarkan transaction_id (invoice_id dari Xendit)
            $payment = Payment::where('transaction_id', $invoiceId)->first();

            if (!$payment) {
                Log::warning('Payment Record Not Found for Refund', ['invoice_id' => $invoiceId]);
                DB::rollBack();
                // Return 200 anyway to stop retries if the record really doesn't exist
                return response()->json(['message' => 'Payment record not found'], 200);
            }

            $booking = $payment->booking;

            if (!$booking) {
                Log::error('Booking Record Not Found for Payment', ['payment_id' => $payment->id]);
                DB::rollBack();
                return response()->json(['message' => 'Booking not found'], 200);
            }

            // Handle berdasarkan status refund dari Xendit
            if ($refundStatus === 'SUCCEEDED' || $refundStatus === 'success' || $refundStatus === 'COMPLETED') {
                Log::info("Refund Success for Booking: {$booking->id}. Updating status.");
                
                // Cegah double decrement jika webhook dikirim dua kali
                if ($booking->refund_status !== 'success') {
                    $booking->update(['refund_status' => 'success']);
                    
                    if ($booking->barbershop) {
                        $booking->barbershop->decrement('balance', $booking->refund_amount);
                        Log::info("Barbershop balance decremented by {$booking->refund_amount}");
                    }
                } else {
                    Log::info("Refund already marked as success for Booking: {$booking->id}");
                }
            } elseif (in_array($refundStatus, ['FAILED', 'REJECTED', 'failed', 'rejected'])) {
                Log::info("Refund FAILED for Booking: {$booking->id}. Xendit Status: $refundStatus");
                $booking->update(['refund_status' => 'failed']);
            } else {
                Log::info("Refund in intermediate status: $refundStatus for Booking: {$booking->id}");
            }

            DB::commit();
            Log::info('--- Xendit Refund Webhook Finished Successfully ---');
            return response()->json(['message' => 'Refund webhook processed'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Refund Webhook Processing Failed: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }

    public function handleWithdrawalWebhook(Request $request)
    {
        $payload = $request->getContent();
        $callbackToken = $request->header('x-callback-token');
        $webhookToken = config('services.xendit.webhook_token');

        Log::info('Withdrawal Webhook Received', ['payload' => $payload]);

        // Validasi webhook token
        if ($webhookToken && !$this->xenditService->verifyWebhookToken($callbackToken, $webhookToken)) {
            Log::warning('Invalid Withdrawal Webhook Token');
            return response()->json(['error' => 'Invalid webhook token'], 401);
        }

        $data = json_decode($payload, true);

        if (!$data || !isset($data['reference_id'])) {
            Log::warning('Invalid Withdrawal Webhook Payload');
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        $externalId = $data['reference_id'];
        $status = $data['status'] ?? null;

        // External ID harus dimulai dengan withdrawal-
        if (!str_starts_with($externalId, 'withdrawal-')) {
            return response()->json(['error' => 'Invalid external_id'], 400);
        }

        $withdrawal = \App\Models\Withdrawal::where('external_id', $externalId)->first();

        if (!$withdrawal) {
            Log::warning('Withdrawal Not Found', ['external_id' => $externalId]);
            return response()->json(['error' => 'Withdrawal not found'], 404);
        }

        // Idempotency: jika sudah processed sebagai success, jangan proses lagi
        if ($withdrawal->status === 'success') {
            Log::info('Withdrawal Already Processed as Success', ['external_id' => $externalId]);
            return response()->json(['message' => 'Already processed'], 200);
        }

        // Jika sudah failed, jangan proses lagi
        if ($withdrawal->status === 'failed') {
            Log::info('Withdrawal Already Failed', ['external_id' => $externalId]);
            return response()->json(['message' => 'Already processed as failed'], 200);
        }

        DB::beginTransaction();
        try {
            $barbershop = $withdrawal->barbershop;

            // Handle berdasarkan status dari Xendit
            if (in_array($status, ['COMPLETED', 'SUCCEEDED', 'completed', 'succeeded', 'SUCCESS'])) {
                // Payout sukses: update status dan kurangi saldo barbershop
                $withdrawal->update([
                    'status' => 'success',
                    'xendit_status' => $status,
                    'processed_at' => now(),
                    'webhook_payload' => $data,
                ]);

                // Kurangi saldo barbershop hanya saat webhook success
                $barbershop->decrement('balance', $withdrawal->amount);

                // Notifikasi
                NotificationService::send(
                    $barbershop->user,
                    'Withdraw Berhasil!',
                    "Withdraw sebesar IDR " . number_format($withdrawal->amount, 0, ',', '.') . " telah berhasil diproses.",
                    'withdraw_success'
                );

                Log::info('Withdrawal Success', [
                    'withdrawal_id' => $withdrawal->id,
                    'amount' => $withdrawal->amount,
                    'external_id' => $externalId
                ]);
            } elseif (in_array($status, ['FAILED', 'REJECTED', 'failed', 'rejected'])) {
                // Payout gagal: update status dan simpan failure reason
                $withdrawal->update([
                    'status' => 'failed',
                    'xendit_status' => $status,
                    'failure_code' => $data['failure_code'] ?? null,
                    'failure_reason' => $data['failure_reason'] ?? 'Unknown error',
                    'processed_at' => now(),
                    'webhook_payload' => $data,
                ]);

                // Notifikasi
                NotificationService::send(
                    $barbershop->user,
                    'Withdraw Gagal',
                    "Withdraw sebesar IDR " . number_format($withdrawal->amount, 0, ',', '.') . " gagal diproses: " . ($data['failure_reason'] ?? 'Unknown error'),
                    'withdraw_failed'
                );

                Log::info('Withdrawal Failed', [
                    'withdrawal_id' => $withdrawal->id,
                    'status' => $status,
                    'external_id' => $externalId,
                    'failure_reason' => $data['failure_reason'] ?? null
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Withdrawal webhook processed'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Withdrawal Webhook Processing Failed', [
                'error' => $e->getMessage(),
                'external_id' => $externalId
            ]);
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }
}
