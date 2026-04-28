<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Barbershop;
use App\Models\Transaction;
use App\Models\Booking;
use App\Models\Capster;
use App\Models\Rating;
use App\Models\Payment;
use Carbon\Carbon;


class PartnerBarbershopController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->barbershop()->exists()) {
            return response()->json([
                "barbershop" => $user->barbershop()->first(),
                "user" => $user->only("name", "email", "avatar")
            ], 200);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        try {
            $findUserBarbershop = $request->user()->barbershop()->first();

            if (!$findUserBarbershop) {
                return response()->json([
                    "message" => "Barbershop not found for the user"
                ], 404);
            }

            $validatedData = $request->validate([
                "name" => "required|string|max:255",
                "address" => "required|string|max:255",
                "phone_number" => "required|string|max:20",
                "description" => "nullable|string",
                "map_url" => "nullable|url",
                "latitude" => "required|string",
                "longitude" => "required|string",
            ]);

            $findUserBarbershop->update($validatedData);

            return response()->json([
                "message" => "Barbershop updated successfully",
                "barbershop" => $findUserBarbershop
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                "message" => "Failed to update barbershop",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    /**
     * Get dashboard stats
     */
    public function dashboardStats(Request $request)
    {
        try {
            $barbershop = $request->user()->barbershop;

            if (!$barbershop) {
                return response()->json(['message' => 'Barbershop not found'], 404);
            }

            $currentMonth = now()->startOfMonth();
            $lastMonth = now()->subMonth()->startOfMonth();
            $currentMonthEnd = now()->endOfMonth();
            $lastMonthEnd = now()->subMonth()->endOfMonth();

            // Total bookings
            $totalBookings = Booking::where('barbershop_id', $barbershop->id)->count();
            $lastMonthBookings = Booking::where('barbershop_id', $barbershop->id)
                ->whereBetween('created_at', [$lastMonth, $lastMonthEnd])
                ->count();
            $currentMonthBookings = Booking::where('barbershop_id', $barbershop->id)
                ->whereBetween('created_at', [$currentMonth, $currentMonthEnd])
                ->count();
            $bookingsChange = $lastMonthBookings > 0
                ? (($currentMonthBookings - $lastMonthBookings) / $lastMonthBookings) * 100
                : 0;

            // Revenue (successful payments)
            $revenueThisMonth = Payment::whereHas('booking', function ($query) use ($barbershop) {
                $query->where('barbershop_id', $barbershop->id);
            })
                ->where('status', 'success')
                ->whereBetween('created_at', [$currentMonth, $currentMonthEnd])
                ->sum('amount');

            $revenueLastMonth = Payment::whereHas('booking', function ($query) use ($barbershop) {
                $query->where('barbershop_id', $barbershop->id);
            })
                ->where('status', 'success')
                ->whereBetween('created_at', [$lastMonth, $lastMonthEnd])
                ->sum('amount');

            $revenueChange = $revenueLastMonth > 0
                ? (($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100
                : 0;

            // Active capsters (is_available = true)
            $activeCapsters = Capster::where('barbershop_id', $barbershop->id)
                ->where('is_available', true)
                ->count();

            // Average rating
            $averageRating = Rating::where('barbershop_id', $barbershop->id)
                ->avg('rating') ?? 0;

            $lastMonthRating = Rating::where('barbershop_id', $barbershop->id)
                ->whereBetween('created_at', [$lastMonth, $lastMonthEnd])
                ->avg('rating') ?? 0;

            $ratingChange = $lastMonthRating > 0
                ? $averageRating - $lastMonthRating
                : 0;

            // Today bookings
            $todayBookings = Booking::where('barbershop_id', $barbershop->id)
                ->whereDate('booking_date', now())
                ->count();

            return response()->json([
                'total_bookings' => $totalBookings,
                'revenue_this_month' => (int) $revenueThisMonth,
                'active_capsters' => $activeCapsters,
                'average_rating' => round($averageRating, 1),
                'today_bookings_count' => $todayBookings,
                'revenue_change' => round($revenueChange, 1),
                'rating_change' => round($ratingChange, 1),
                'bookings_change' => round($bookingsChange, 1),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch dashboard stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get today's appointments
     */
    public function todayAppointments(Request $request)
    {
        try {
            $barbershop = $request->user()->barbershop;

            if (!$barbershop) {
                return response()->json(['message' => 'Barbershop not found'], 404);
            }

            $appointments = Booking::with(['service', 'capster', 'user'])
                ->where('barbershop_id', $barbershop->id)
                ->whereDate('booking_date', now())
                ->where('status', '!=', 'cancelled')
                ->orderBy('booking_time', 'asc')
                ->get()
                ->map(function ($booking) {
                    return [
                        'id' => $booking->id,
                        'customer_name' => $booking->user->name,
                        'service_name' => $booking->service->name,
                        'capster_name' => $booking->capster->name,
                        'booking_time' => $booking->booking_time,
                        'status' => $booking->status,
                    ];
                });

            return response()->json(['data' => $appointments]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch today appointments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent bookings
     */
    public function recentBookings(Request $request)
    {
        try {
            $barbershop = $request->user()->barbershop;

            if (!$barbershop) {
                return response()->json(['message' => 'Barbershop not found'], 404);
            }

            $bookings = Booking::with(['service', 'capster', 'user', 'payment'])
                ->where('barbershop_id', $barbershop->id)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($booking) {
                    return [
                        'id' => $booking->id,
                        'customer_name' => $booking->user->name,
                        'service_name' => $booking->service->name,
                        'capster_name' => $booking->capster->name,
                        'booking_date' => $booking->booking_date,
                        'booking_time' => $booking->booking_time,
                        'status' => $booking->status,
                        'total_price' => $booking->payment?->amount ?? $booking->service->price,
                    ];
                });

            return response()->json(['data' => $bookings]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch recent bookings',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
