<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\BookingConflictException;
use App\Services\BookingPresenter;
use App\Services\BookingService;
use App\Support\AuthContext;
use App\Support\Integrations\CatalogGateway;
use App\Support\Integrations\PaymentGateway;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController
{
    public function __construct(
        private readonly CatalogGateway $catalog,
        private readonly PaymentGateway $payments,
        private readonly BookingService $bookings,
        private readonly BookingPresenter $presenter,
    ) {
    }

    /**
     * GET /api/barbershop/{barbershop}/available-slots
     */
    public function getAvailableSlots(Request $request, string $barbershop): JsonResponse
    {
        $date = trim((string) $request->query('date', ''));
        $capsterId = trim((string) $request->query('capster_id', ''));
        $serviceId = trim((string) $request->query('service_id', ''));

        if ($date === '' || $capsterId === '' || $serviceId === '') {
            return response()->json(['message' => 'Missing parameters'], 400);
        }

        if (! $this->isValidDate($date)) {
            return response()->json(['message' => 'Invalid date format'], 422);
        }

        $result = $this->catalog->validateBooking([
            'barbershop_id' => $barbershop,
            'service_id' => $serviceId,
            'capster_id' => $capsterId,
        ]);

        if (! $result['ok']) {
            return $this->catalogFailure($result['status']);
        }

        $data = $result['data']['data'] ?? $result['data'];

        if (! is_array($data) || ! ($data['valid'] ?? false)) {
            return response()->json(['message' => 'Invalid booking request'], 422);
        }

        $shop = $data['barbershop'] ?? [];
        $service = $data['service'] ?? [];

        $open = $shop['open_time'] ?? null;
        $close = $shop['close_time'] ?? null;
        $duration = (int) ($service['duration_minutes'] ?? 0);

        if ($open === null || $close === null || $duration <= 0) {
            return response()->json(['message' => 'Catalog returned incomplete booking data'], 503);
        }

        $start = Carbon::parse($date.' '.$open, (string) config('app.timezone'));
        $closing = Carbon::parse($date.' '.$close, (string) config('app.timezone'));
        $now = now();

        $booked = Booking::query()
            ->where('capster_id', $capsterId)
            ->whereDate('booking_date', $date)
            ->whereIn('status', Booking::ACTIVE_STATUSES)
            ->get();

        $slots = [];
        $current = $start->copy();

        while ($current->copy()->addMinutes($duration)->lessThanOrEqualTo($closing)) {
            $slotStart = $current->copy();
            $slotEnd = $current->copy()->addMinutes($duration);

            $current->addMinutes(30);

            if ($slotStart->lessThan($now)) {
                continue;
            }

            $isBooked = $booked->contains(
                static fn (Booking $booking): bool => $booking->overlaps($slotStart, $slotEnd),
            );

            if (! $isBooked) {
                $slots[] = $slotStart->format('H:i');
            }
        }

        return response()->json(['slots' => $slots]);
    }

    /**
     * GET /api/bookings
     */
    public function index(Request $request): JsonResponse
    {
        /** @var AuthContext $user */
        $user = $request->user();

        $bookings = Booking::query()
            ->where('user_id', $user->id)
            ->orderByDesc('booking_date')
            ->orderByDesc('booking_time')
            ->get();

        return response()->json(['data' => $this->presenter->presentMany($bookings)]);
    }

    /**
     * POST /api/bookings
     */
    public function store(Request $request): JsonResponse
    {
        /** @var AuthContext $user */
        $user = $request->user();

        $validated = $request->validate([
            'barbershop_id' => ['required', 'uuid'],
            'service_id' => ['required', 'uuid'],
            'capster_id' => ['required', 'uuid'],
            'booking_date' => ['required', 'date_format:Y-m-d'],
            'booking_time' => ['required', 'date_format:H:i'],
        ]);

        $start = Carbon::parse(
            $validated['booking_date'].' '.$validated['booking_time'],
            (string) config('app.timezone'),
        );

        if ($start->lessThan(now())) {
            return response()->json(['message' => 'Tidak dapat booking jadwal yang sudah lewat.'], 422);
        }

        $result = $this->catalog->validateBooking([
            'barbershop_id' => $validated['barbershop_id'],
            'service_id' => $validated['service_id'],
            'capster_id' => $validated['capster_id'],
        ]);

        if (! $result['ok']) {
            return $this->catalogFailure($result['status']);
        }

        $data = $result['data']['data'] ?? $result['data'];

        if (! is_array($data) || ! ($data['valid'] ?? false)) {
            return response()->json(['message' => 'Invalid booking request'], 422);
        }

        $shop = $data['barbershop'] ?? [];
        $service = $data['service'] ?? [];
        $capster = $data['capster'] ?? [];

        if (! isset($shop['name'], $service['price'], $service['duration_minutes'], $capster['name'])) {
            return response()->json(['message' => 'Catalog returned incomplete booking data'], 503);
        }

        try {
            $booking = $this->bookings->create([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'barbershop_id' => $validated['barbershop_id'],
                'barbershop_name' => (string) $shop['name'],
                'barbershop_owner_id' => (string) ($shop['user_id'] ?? $shop['barbershop_owner_id']),
                'service_id' => $validated['service_id'],
                'service_name' => (string) $service['name'],
                'service_price' => (float) $service['price'],
                'service_duration_minutes' => (int) $service['duration_minutes'],
                'capster_id' => $validated['capster_id'],
                'capster_name' => (string) $capster['name'],
                'booking_date' => $validated['booking_date'],
                'booking_time' => $validated['booking_time'],
                'status' => 'pending',
                'total_price' => (float) $service['price'],
            ]);
        } catch (BookingConflictException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Booking created successfully',
            'booking' => $this->presenter->present($booking, null, null, $shop['address'] ?? null),
        ], 201);
    }

    /**
     * GET /api/bookings/{booking}
     */
    public function show(Request $request, Booking $booking): JsonResponse
    {
        /** @var AuthContext $user */
        $user = $request->user();

        if (! $this->canView($booking, $user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $shop = $this->catalog->barbershop((string) $booking->barbershop_id);
        $address = is_array($shop) ? ($shop['address'] ?? null) : null;

        return response()->json($this->presenter->present(
            $booking,
            $this->paymentFor($booking),
            $this->ratingFor($booking),
            $address,
        ));
    }

    /**
     * POST /api/bookings/{booking}/cancel
     */
    public function cancelBooking(Request $request, Booking $booking): JsonResponse
    {
        /** @var AuthContext $user */
        $user = $request->user();

        if (! $booking->isOwnedBy($user->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (! in_array($booking->status, Booking::ACTIVE_STATUSES, true)) {
            return response()->json(['message' => 'Cannot cancel this booking'], 400);
        }

        $result = $this->bookings->cancel($booking, 'customer');

        return response()->json([
            'message' => 'Booking cancelled successfully',
            'refund_amount' => $result['refund_amount'],
            'refund_status' => $result['refund_status'],
            'booking' => $this->presenter->present(
                $result['booking'],
                $this->paymentFor($result['booking']),
                null,
            ),
        ]);
    }

    private function canView(Booking $booking, AuthContext $user): bool
    {
        if ($booking->isOwnedBy($user->id)) {
            return true;
        }

        $shop = $this->catalog->barbershopByOwner($user->id);

        return $shop !== null && (string) ($shop['id'] ?? '') === (string) $booking->barbershop_id;
    }

    private function paymentFor(Booking $booking): ?array
    {
        $payment = $this->payments->byBooking($booking->id);

        return is_array($payment) ? $payment : null;
    }

    private function ratingFor(Booking $booking): ?array
    {
        $ratings = $this->catalog->ratingsByBookings([$booking->id]);

        $rating = $ratings[(string) $booking->id] ?? null;

        return is_array($rating) ? $rating : null;
    }

    private function catalogFailure(int $status): JsonResponse
    {
        if (in_array($status, [400, 404, 409, 422], true)) {
            return response()->json(['message' => 'Invalid booking request'], 422);
        }

        return response()->json(['message' => 'Catalog service unavailable'], 503);
    }

    private function isValidDate(string $date): bool
    {
        try {
            return Carbon::createFromFormat('Y-m-d', $date)->format('Y-m-d') === $date;
        } catch (\Throwable) {
            return false;
        }
    }
}
