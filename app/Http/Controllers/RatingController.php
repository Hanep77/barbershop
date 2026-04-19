<?php

namespace App\Http\Controllers;

use App\Models\Rating;
use App\Models\Barbershop;
use App\Models\Booking;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    public function index(Barbershop $barbershop)
    {
        $ratings = Rating::with('user')
            ->where('barbershop_id', $barbershop->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $ratings]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'barbershop_id' => 'required|exists:barbershops,id',
            'booking_id' => 'nullable|exists:bookings,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        // If booking_id is provided, verify it belongs to the user and is completed
        if (isset($validated['booking_id'])) {
            $booking = Booking::where('id', $validated['booking_id'])
                ->where('user_id', $request->user()->id)
                ->where('status', 'completed')
                ->first();

            if (!$booking) {
                return response()->json(['message' => 'Invalid booking or booking not completed'], 400);
            }

            // Check if already rated
            if (Rating::where('booking_id', $validated['booking_id'])->exists()) {
                return response()->json(['message' => 'This booking has already been rated'], 400);
            }
        }

        $rating = Rating::create(array_merge($validated, [
            'user_id' => $request->user()->id,
        ]));

        return response()->json(['message' => 'Rating submitted successfully', 'data' => $rating], 201);
    }
}
