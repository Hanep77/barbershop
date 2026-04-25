<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Payment;
use App\Services\XenditService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Booking;
use App\Models\Barbershop;
use App\Models\Service;
use App\Models\Notification;
use App\Events\NotificationSent;
use Illuminate\Http\Request;
use Carbon\Carbon;

class BookingController extends Controller
{
    protected $xenditService;

    public function __construct(XenditService $xenditService)
    {
        $this->xenditService = $xenditService;
    }

    public function storeBooking(Request $request)
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


    public function getAvailableSlots(Request $request, Barbershop $barbershop)
    {
        $date = $request->query('date');
        $capsterId = $request->query('capster_id');
        $serviceId = $request->query('service_id');

        if (!$date || !$capsterId || !$serviceId) {
            return response()->json(['message' => 'Missing parameters'], 400);
        }

        $duration = Service::findOrFail($serviceId)->duration_minutes;
        $start = Carbon::parse($barbershop->open_time);
        $end = Carbon::parse($barbershop->close_time);

        $bookedSlots = Booking::where('capster_id', $capsterId)
            ->where('booking_date', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->get();

        $availableSlots = [];
        $current = Carbon::parse($barbershop->open_time);
        $closingTime = Carbon::parse($barbershop->close_time);

        while ($current->copy()->addMinutes($duration)->lessThanOrEqualTo($closingTime)) {
            $slotStart = $current->copy();
            $slotEnd = $current->copy()->addMinutes($duration);

            $isBooked = $bookedSlots->contains(function ($booking) use ($slotStart, $slotEnd) {
                $bookingStart = Carbon::parse($booking->booking_time);
                $bookingEnd = $bookingStart->copy()->addMinutes($booking->service->duration_minutes);

                return ($slotStart->between($bookingStart, $bookingEnd) ||
                    $slotEnd->between($bookingStart, $bookingEnd) ||
                    $bookingStart->between($slotStart, $slotEnd));
            });

            if (!$isBooked) {
                $availableSlots[] = $slotStart->format('H:i');
            }
            $current->addMinutes(30); // Interval 30 menit
        }

        return response()->json(['slots' => $availableSlots]);
    }

    public function index(Request $request)
    {
        $bookings = Booking::with(['barbershop', 'service', 'capster'])
            ->where('user_id', $request->user()->id)
            ->orderBy('booking_date', 'desc')
            ->orderBy('booking_time', 'desc')
            ->get();

        return response()->json(['data' => $bookings]);
    }

    public function partnerIndex(Request $request)
    {
        $barbershop = $request->user()->barbershop;

        if (!$barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $bookings = Booking::with(['user', 'service', 'capster'])
            ->where('barbershop_id', $barbershop->id)
            ->orderBy('booking_date', 'desc')
            ->orderBy('booking_time', 'desc')
            ->get();

        return response()->json(['data' => $bookings]);
    }

    public function updateStatus(Request $request, Booking $booking)
    {
        $barbershop = $request->user()->barbershop;

        if (!$barbershop || $booking->barbershop_id !== $barbershop->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,completed,cancelled'
        ]);

        $booking->update($validated);

        return response()->json(['message' => 'Booking status updated successfully', 'booking' => $booking]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'barbershop_id' => 'required|exists:barbershops,id',
            'service_id' => 'required|exists:services,id',
            'capster_id' => 'required|exists:capsters,id',
            'booking_date' => 'required|date',
            'booking_time' => 'required',
        ]);

        $booking = Booking::create(array_merge($validated, [
            'user_id' => $request->user()->id,
            'status' => 'pending'
        ]));

        // Load barbershop owner to notify
        $barbershop = Barbershop::findOrFail($validated['barbershop_id']);
        $owner = $barbershop->user;

        if ($owner) {
            $formattedDate = \Carbon\Carbon::parse($booking->booking_date)->format('M d, Y');
            $formattedTime = \Carbon\Carbon::parse($booking->booking_time)->format('h:i A');

            $notification = Notification::create([
                'user_id' => $owner->id,
                'title' => 'New Booking Alert!',
                'message' => 'A new booking has been made for ' . $barbershop->name . ' on ' . $formattedDate . ' at ' . $formattedTime,
                'type' => 'booking_created',
                'is_read' => false,
            ]);

            event(new NotificationSent($notification));
        }

        return response()->json(['message' => 'Booking created successfully', 'booking' => $booking], 201);
    }
}
