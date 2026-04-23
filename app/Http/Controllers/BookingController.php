<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Barbershop;
use App\Models\Service;
use App\Models\Notification;
use App\Events\NotificationSent;
use Illuminate\Http\Request;
use Carbon\Carbon;

class BookingController extends Controller
{
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
            $notification = Notification::create([
                'user_id' => $owner->id,
                'title' => 'New Booking Alert!',
                'message' => 'A new booking has been made for ' . $barbershop->name . ' on ' . $booking->booking_date . ' at ' . $booking->booking_time,
                'type' => 'booking_created',
                'is_read' => false,
            ]);

            event(new NotificationSent($notification));
        }

        return response()->json(['message' => 'Booking created successfully', 'booking' => $booking], 201);
    }
}
