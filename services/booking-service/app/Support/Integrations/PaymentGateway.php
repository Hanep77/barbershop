<?php

namespace App\Support\Integrations;

use App\Support\InternalClient;
use Throwable;

/**
 * Client for the payment service internal endpoints.
 *
 * Reads degrade to null/[]; refunds throw so the caller can flag the booking
 * refund as failed.
 */
final class PaymentGateway
{
    public function byBooking(int|string $bookingId): ?array
    {
        try {
            $data = InternalClient::for('payment')
                ->get('/internal/payments/by-booking/'.rawurlencode((string) $bookingId));
        } catch (Throwable) {
            return null;
        }

        $payment = $data['payment'] ?? $data;

        if (! is_array($payment) || $payment === []) {
            return null;
        }

        return $payment;
    }

    /**
     * Batch lookup used to enrich booking listings. The payment service may
     * not expose this endpoint yet; a failure simply yields no enrichment.
     *
     * @param array<int, int|string> $bookingIds
     * @return array<string, array>
     */
    public function byBookings(array $bookingIds): array
    {
        $bookingIds = array_values(array_map(static fn ($id) => (string) $id, $bookingIds));

        if ($bookingIds === []) {
            return [];
        }

        try {
            $data = InternalClient::for('payment')
                ->post('/internal/payments/by-bookings', ['booking_ids' => $bookingIds]);
        } catch (Throwable) {
            return [];
        }

        $payments = $data['payments'] ?? $data['data'] ?? [];

        if (! is_array($payments)) {
            return [];
        }

        if (array_is_list($payments)) {
            $keyed = [];

            foreach ($payments as $payment) {
                if (is_array($payment) && isset($payment['booking_id'])) {
                    $keyed[(string) $payment['booking_id']] = $payment;
                }
            }

            return $keyed;
        }

        return $payments;
    }

    /**
     * @return array<string, mixed>
     */
    public function refund(int|string $bookingId, float $amount, string $reason): array
    {
        return InternalClient::for('payment')->post('/internal/payments/refund', [
            'booking_id' => $bookingId,
            'amount' => $amount,
            'reason' => $reason,
        ]);
    }

    public function stats(string $barbershopId, ?string $from = null, ?string $to = null): ?array
    {
        try {
            $data = InternalClient::for('payment')->get(
                '/internal/payments/stats/'.rawurlencode($barbershopId),
                array_filter(['from' => $from, 'to' => $to], static fn ($value) => $value !== null),
            );
        } catch (Throwable) {
            return null;
        }

        $stats = $data['stats'] ?? $data;

        return is_array($stats) && $stats !== [] ? $stats : null;
    }
}
