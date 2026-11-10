<?php

namespace App\Support;

use Throwable;

/**
 * Reads booking snapshots from the booking service.
 */
final class BookingClient
{
    public function find(int|string $bookingId): ?array
    {
        try {
            $response = InternalClient::for('booking')->get('/internal/bookings/'.rawurlencode((string) $bookingId));
        } catch (Throwable) {
            return null;
        }

        $booking = $response['booking']
            ?? data_get($response, 'data.booking')
            ?? $response['data']
            ?? $response;

        if (! is_array($booking) || ! isset($booking['id'])) {
            return null;
        }

        return $booking;
    }
}
