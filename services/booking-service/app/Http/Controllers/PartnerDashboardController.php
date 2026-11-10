<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Support\AuthContext;
use App\Support\Integrations\CatalogGateway;
use App\Support\Integrations\PaymentGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerDashboardController
{
    public function __construct(
        private readonly CatalogGateway $catalog,
        private readonly PaymentGateway $payments,
    ) {
    }

    /**
     * GET /api/partner/barbershop/dashboard/stats
     *
     * Composition: booking counts are local, revenue comes from Payment,
     * capster/rating aggregates come from Catalog.
     */
    public function stats(Request $request): JsonResponse
    {
        $shop = $this->ownerShop($request);

        if ($shop === null) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $barbershopId = (string) $shop['id'];

        $currentMonthStart = now()->startOfMonth();
        $currentMonthEnd = now()->endOfMonth();
        $lastMonthStart = now()->subMonthNoOverflow()->startOfMonth();
        $lastMonthEnd = now()->subMonthNoOverflow()->endOfMonth();

        $totalBookings = Booking::query()->where('barbershop_id', $barbershopId)->count();

        $currentMonthBookings = Booking::query()
            ->where('barbershop_id', $barbershopId)
            ->whereBetween('created_at', [$currentMonthStart, $currentMonthEnd])
            ->count();

        $lastMonthBookings = Booking::query()
            ->where('barbershop_id', $barbershopId)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->count();

        $bookingsChange = $lastMonthBookings > 0
            ? (($currentMonthBookings - $lastMonthBookings) / $lastMonthBookings) * 100
            : 0;

        $todayBookings = Booking::query()
            ->where('barbershop_id', $barbershopId)
            ->whereDate('booking_date', now()->toDateString())
            ->count();

        $paymentStats = $this->payments->stats(
            $barbershopId,
            $currentMonthStart->toDateString(),
            $currentMonthEnd->toDateString(),
        ) ?? [];

        $catalogStats = $this->catalog->barbershopStats($barbershopId) ?? [];

        $revenueThisMonth = $paymentStats['revenue'] ?? $paymentStats['current_month'] ?? 0;
        $revenueChange = $paymentStats['revenue_change'] ?? 0;

        return response()->json([
            'total_bookings' => $totalBookings,
            'revenue_this_month' => (int) $revenueThisMonth,
            'active_capsters' => (int) ($catalogStats['active_capsters'] ?? 0),
            'average_rating' => round((float) ($catalogStats['average_rating'] ?? 0), 1),
            'today_bookings_count' => $todayBookings,
            'revenue_change' => round((float) $revenueChange, 1),
            'rating_change' => round((float) ($catalogStats['rating_change'] ?? 0), 1),
            'bookings_change' => round($bookingsChange, 1),
        ]);
    }

    /**
     * GET /api/partner/barbershop/dashboard/today-appointments
     */
    public function todayAppointments(Request $request): JsonResponse
    {
        $shop = $this->ownerShop($request);

        if ($shop === null) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $rows = Booking::query()
            ->where('barbershop_id', (string) $shop['id'])
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
     * GET /api/partner/barbershop/dashboard/recent-bookings
     */
    public function recentBookings(Request $request): JsonResponse
    {
        $shop = $this->ownerShop($request);

        if ($shop === null) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $rows = Booking::query()
            ->where('barbershop_id', (string) $shop['id'])
            ->orderByDesc('created_at')
            ->limit(5)
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

    private function ownerShop(Request $request): ?array
    {
        /** @var AuthContext $user */
        $user = $request->user();

        return $this->catalog->barbershopByOwner($user->id);
    }
}
