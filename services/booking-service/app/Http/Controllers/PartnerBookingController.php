<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\BookingPresenter;
use App\Services\BookingService;
use App\Support\AuthContext;
use App\Support\Integrations\CatalogGateway;
use App\Support\Integrations\PaymentGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerBookingController
{
    public function __construct(
        private readonly CatalogGateway $catalog,
        private readonly PaymentGateway $payments,
        private readonly BookingService $bookings,
        private readonly BookingPresenter $presenter,
    ) {
    }

    /**
     * GET /api/partner/barbershop/bookings
     */
    public function index(Request $request): JsonResponse
    {
        $shop = $this->ownerShop($request);

        if ($shop === null) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $bookings = Booking::query()
            ->where('barbershop_id', (string) $shop['id'])
            ->orderByDesc('booking_date')
            ->orderByDesc('booking_time')
            ->get()
            ->map(fn (Booking $booking): array => $this->presenter->snapshot(
                $booking,
                $shop['address'] ?? null,
            ));

        return response()->json(['data' => $bookings->all()]);
    }

    /**
     * PUT /api/partner/barbershop/bookings/{booking}/status
     */
    public function updateStatus(Request $request, Booking $booking): JsonResponse
    {
        $shop = $this->ownerShop($request);

        if ($shop === null || (string) $shop['id'] !== (string) $booking->barbershop_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:pending,confirmed,completed,cancelled'],
        ]);

        $booking = $this->bookings->updateStatus($booking, $validated['status']);

        return response()->json([
            'message' => 'Booking status updated successfully',
            'booking' => $this->presenter->snapshot($booking, $shop['address'] ?? null),
        ]);
    }

    /**
     * POST /api/partner/barbershop/bookings/{booking}/cancel
     */
    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        $shop = $this->ownerShop($request);

        if ($shop === null || (string) $shop['id'] !== (string) $booking->barbershop_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (! in_array($booking->status, Booking::ACTIVE_STATUSES, true)) {
            return response()->json(['message' => 'Cannot cancel this booking'], 400);
        }

        $result = $this->bookings->cancel($booking, 'barbershop');

        return response()->json([
            'message' => 'Booking cancelled successfully',
            'booking_status' => 'cancelled',
            'refund_amount' => $result['refund_amount'],
            'refund_status' => $result['refund_status'],
            'booking' => $this->presenter->present(
                $result['booking'],
                $this->payments->byBooking($result['booking']->id),
                null,
                $shop['address'] ?? null,
            ),
        ]);
    }

    private function ownerShop(Request $request): ?array
    {
        /** @var AuthContext $user */
        $user = $request->user();

        return $this->catalog->barbershopByOwner($user->id);
    }
}
