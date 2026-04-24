<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateBookingRequest;
use App\Models\Transaction;
use App\Models\Payment;
use App\Services\XenditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{
    protected $xenditService;

    public function __construct(XenditService $xenditService)
    {
        $this->xenditService = $xenditService;
    }

    public function store(CreateBookingRequest $request)
    {
        $validated = $request->validated();
        $user = $request->user();

        DB::beginTransaction();
        try {
            // Create booking
            $booking = Transaction::create([
                'user_id' => $user->id,
                'barbershop_id' => $validated['barbershop_id'],
                'service_id' => $validated['service_id'],
                'capster_id' => $validated['capster_id'],
                'booking_date' => $validated['booking_date'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'status' => 'pending',
                'total_price' => 0, // Will be set from service price
            ]);

            // Get service price
            $service = $booking->service;
            $booking->update(['total_price' => $service->price]);

            // Create payment
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'amount' => $service->price,
                'status' => 'pending',
            ]);

            // Create Xendit invoice
            $invoiceData = [
                'external_id' => $payment->id,
                'amount' => $service->price,
                'description' => 'Payment for booking ' . $booking->id,
                'invoice_duration' => 86400, // 24 hours
                'customer' => [
                    'given_names' => $user->name,
                    'email' => $user->email,
                ],
                'customer_notification_preference' => [
                    'invoice_created' => ['whatsapp', 'sms', 'email'],
                    'invoice_reminder' => ['whatsapp', 'sms', 'email'],
                    'invoice_paid' => ['whatsapp', 'sms', 'email'],
                    'invoice_expired' => ['whatsapp', 'sms', 'email'],
                ],
                'success_redirect_url' => config('app.url') . '/payment/success',
                'failure_redirect_url' => config('app.url') . '/payment/failed',
                'currency' => 'IDR',
            ];

            $invoice = $this->xenditService->createInvoice($invoiceData);

            // Update payment with transaction_id
            $payment->update([
                'transaction_id' => $invoice['id'],
                'payment_method' => 'xendit',
            ]);

            DB::commit();

            Log::info('Booking and Payment Created', ['booking_id' => $booking->id, 'payment_id' => $payment->id]);

            return response()->json([
                'booking' => $booking->load(['service', 'capster', 'barbershop']),
                'payment' => $payment,
                'invoice_url' => $invoice['invoice_url'] ?? null,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Booking Creation Failed', ['error' => $e->getMessage(), 'user_id' => $user->id]);
            return response()->json(['error' => 'Failed to create booking'], 500);
        }
    }

    public function show($id)
    {
        $booking = Transaction::with(['service', 'capster', 'barbershop', 'payment'])->findOrFail($id);

        return response()->json($booking);
    }
}
