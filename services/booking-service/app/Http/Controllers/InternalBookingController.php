<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\BookingPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InternalBookingController
{
    public function __construct(private readonly BookingPresenter $presenter)
    {
    }

    /**
     * GET /internal/bookings/{booking}
     */
    public function show(Booking $booking): JsonResponse
    {
        return response()->json($this->presenter->snapshot($booking));
    }

    /**
     * POST /internal/bookings/{booking}/validate-review
     */
    public function validateReview(Request $request, Booking $booking): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'string'],
        ]);

        $valid = (string) $booking->user_id === (string) $validated['user_id']
            && $booking->status === 'completed';

        return response()->json([
            'valid' => $valid,
            'status' => $booking->status,
            'user_id' => $booking->user_id,
            'capster_id' => $booking->capster_id,
            'barbershop_id' => $booking->barbershop_id,
        ]);
    }

    /**
     * GET /internal/bookings/by-barbershop/{barbershopId}/stats?from=&to=
     */
    public function stats(Request $request, string $barbershopId): JsonResponse
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $totalQuery = Booking::query()->where('barbershop_id', $barbershopId);

        if (is_string($from) && $from !== '') {
            $totalQuery->where('created_at', '>=', $from);
        }

        if (is_string($to) && $to !== '') {
            $totalQuery->where('created_at', '<=', $to);
        }

        $currentMonthStart = now()->startOfMonth();
        $currentMonthEnd = now()->endOfMonth();
        $lastMonthStart = now()->subMonthNoOverflow()->startOfMonth();
        $lastMonthEnd = now()->subMonthNoOverflow()->endOfMonth();

        $currentMonth = Booking::query()
            ->where('barbershop_id', $barbershopId)
            ->whereBetween('created_at', [$currentMonthStart, $currentMonthEnd])
            ->count();

        $lastMonth = Booking::query()
            ->where('barbershop_id', $barbershopId)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->count();

        $change = $lastMonth > 0
            ? (($currentMonth - $lastMonth) / $lastMonth) * 100
            : 0;

        return response()->json([
            'total_bookings' => $totalQuery->count(),
            'current_month' => $currentMonth,
            'last_month' => $lastMonth,
            'bookings_change' => round($change, 1),
        ]);
    }

    /**
     * GET /internal/bookings/by-barbershop/{barbershopId}/today
     */
    public function today(string $barbershopId): JsonResponse
    {
        $rows = Booking::query()
            ->where('barbershop_id', $barbershopId)
            ->whereDate('booking_date', now()->toDateString())
            ->where('status', '!=', 'cancelled')
            ->orderBy('booking_time')
            ->get()
            ->map(fn (Booking $booking): array => [
                'id' => $booking->id,
                'customer_name' => $booking->user_name,
                'service_name' => $booking->service_name,
                'capster_name' => $booking->capster_name,
                'booking_time' => $booking->booking_time->format('H:i'),
                'status' => $booking->status,
            ]);

        return response()->json(['data' => $rows->all()]);
    }

    /**
     * GET /internal/bookings/by-barbershop/{barbershopId}/recent?limit=5
     */
    public function recent(Request $request, string $barbershopId): JsonResponse
    {
        $limit = max(1, min(50, (int) $request->query('limit', 5)));

        $rows = Booking::query()
            ->where('barbershop_id', $barbershopId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Booking $booking): array => [
                'id' => $booking->id,
                'customer_name' => $booking->user_name,
                'service_name' => $booking->service_name,
                'capster_name' => $booking->capster_name,
                'booking_date' => $booking->booking_date->format('Y-m-d'),
                'booking_time' => $booking->booking_time->format('H:i'),
                'status' => $booking->status,
                'total_price' => (float) $booking->total_price,
            ]);

        return response()->json(['data' => $rows->all()]);
    }
}
