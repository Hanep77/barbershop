<?php

namespace App\Services;

use App\Models\Booking;
use App\Support\Integrations\CatalogGateway;
use App\Support\Integrations\PaymentGateway;
use Illuminate\Support\Collection;

/**
 * Flattens a booking row plus its price/duration snapshots into the JSON the
 * frontend already consumes (nested service/capster/barbershop/user objects
 * instead of cross-service relations).
 */
class BookingPresenter
{
    public function __construct(
        private readonly CatalogGateway $catalog,
        private readonly PaymentGateway $payments,
    ) {
    }

    public function snapshot(Booking $booking, ?string $address = null): array
    {
        $data = $booking->toArray();

        $data['service_price'] = (float) ($data['service_price'] ?? 0);
        $data['total_price'] = (float) ($data['total_price'] ?? 0);
        $data['refund_amount'] = (float) ($data['refund_amount'] ?? 0);
        $data['refund_status'] = $data['refund_status'] ?? 'none';
        $data['cancellation_reason'] = $data['cancellation_reason'] ?? null;
        $data['cancelled_by'] = $data['cancelled_by'] ?? null;

        $data['service'] = [
            'id' => $booking->service_id,
            'barbershop_id' => $booking->barbershop_id,
            'name' => $booking->service_name,
            'price' => (float) $booking->service_price,
            'duration_minutes' => (int) $booking->service_duration_minutes,
        ];

        $data['capster'] = [
            'id' => $booking->capster_id,
            'barbershop_id' => $booking->barbershop_id,
            'name' => $booking->capster_name,
        ];

        $data['barbershop'] = [
            'id' => $booking->barbershop_id,
            'user_id' => $booking->barbershop_owner_id,
            'name' => $booking->barbershop_name,
            'address' => $address,
        ];

        $data['user'] = [
            'id' => $booking->user_id,
            'name' => $booking->user_name,
            'email' => $booking->user_email,
        ];

        return $data;
    }

    public function present(
        Booking $booking,
        ?array $payment = null,
        ?array $rating = null,
        ?string $address = null,
    ): array {
        return array_merge($this->snapshot($booking, $address), [
            'payment' => $payment,
            'rating' => $rating,
        ]);
    }

    /**
     * @param Collection<int, Booking> $bookings
     * @return array<int, array>
     */
    public function presentMany(Collection $bookings): array
    {
        if ($bookings->isEmpty()) {
            return [];
        }

        $ids = $bookings->pluck('id')->map(static fn ($id) => (string) $id)->all();

        $payments = $this->payments->byBookings($ids);
        $ratings = $this->catalog->ratingsByBookings($ids);
        $addresses = $this->catalog->barbershopSummaries(
            $bookings->pluck('barbershop_id')->unique()->values()->all(),
        );

        return $bookings
            ->map(fn (Booking $booking): array => $this->present(
                $booking,
                $this->pick($payments, $booking->id),
                $this->pick($ratings, $booking->id),
                $addresses[$booking->barbershop_id]['address'] ?? null,
            ))
            ->all();
    }

    private function pick(array $map, int|string $id): ?array
    {
        $value = $map[(string) $id] ?? null;

        return is_array($value) ? $value : null;
    }
}
