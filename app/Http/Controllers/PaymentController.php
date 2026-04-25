<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Transaction;
use App\Services\XenditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

    public function webhook(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('x-callback-token');
        $webhookToken = config('services.xendit.webhook_token');

        Log::info('Webhook Received', ['payload' => $payload, 'signature' => $signature]);

        // Verify signature
        if (!$this->xenditService->verifyWebhookSignature($payload, $signature, $webhookToken)) {
            Log::warning('Invalid Webhook Signature');
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $data = json_decode($payload, true);

        if (!$data || !isset($data['external_id'])) {
            Log::warning('Invalid Webhook Payload');
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        $paymentId = $data['external_id'];
        $status = $data['status'];

        $payment = Payment::find($paymentId);
        if (!$payment) {
            Log::warning('Payment Not Found', ['payment_id' => $paymentId]);
            return response()->json(['error' => 'Payment not found'], 404);
        }

        // Idempotency: Check if already processed
        if ($payment->status !== 'pending') {
            Log::info('Webhook Already Processed', ['payment_id' => $paymentId, 'status' => $payment->status]);
            return response()->json(['message' => 'Already processed'], 200);
        }

        DB::beginTransaction();
        try {
            if ($status === 'PAID') {
                $payment->update(['status' => 'success']);
                $booking = $payment->booking;
                $booking->update(['status' => 'confirmed']);

                // Add to barbershop balance
                $barbershop = $booking->barbershop;
                $barbershop->increment('balance', $payment->amount);

                Log::info('Payment Success', ['payment_id' => $paymentId, 'booking_id' => $booking->id]);
            } elseif (in_array($status, ['EXPIRED', 'FAILED'])) {
                $payment->update(['status' => 'failed']);
                // Booking remains pending or can be cancelled, but for safety, keep pending
                Log::info('Payment Failed', ['payment_id' => $paymentId, 'status' => $status]);
            }

            DB::commit();
            return response()->json(['message' => 'Webhook processed'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Webhook Processing Failed', ['error' => $e->getMessage(), 'payment_id' => $paymentId]);
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }
}
