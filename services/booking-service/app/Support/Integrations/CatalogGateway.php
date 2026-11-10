<?php

namespace App\Support\Integrations;

use App\Support\InternalClient;
use Throwable;

/**
 * Read-through client for the catalog service.
 *
 * Every read degrades to null/[] so a catalog outage never breaks the
 * booking read paths. Mutating flows (booking validation) get the raw
 * result so the controller can decide between 422 and 503.
 */
final class CatalogGateway
{
    /**
     * @return array{ok: bool, status: int, data: array}
     */
    public function validateBooking(array $payload): array
    {
        try {
            $data = InternalClient::for('catalog')
                ->post('/internal/catalog/validate-booking', $payload);

            return ['ok' => true, 'status' => 200, 'data' => $data];
        } catch (Throwable $e) {
            return ['ok' => false, 'status' => self::statusOf($e), 'data' => []];
        }
    }

    public function barbershopByOwner(string $userId): ?array
    {
        return $this->fetchBarbershop('/internal/barbershops/by-owner/'.rawurlencode($userId));
    }

    public function barbershop(string $id): ?array
    {
        return $this->fetchBarbershop('/internal/barbershops/'.rawurlencode($id));
    }

    public function barbershopStats(string $id): ?array
    {
        try {
            $data = InternalClient::for('catalog')
                ->get('/internal/barbershops/'.rawurlencode($id).'/stats');
        } catch (Throwable) {
            return null;
        }

        $stats = $data['stats'] ?? $data;

        return is_array($stats) && $stats !== [] ? $stats : null;
    }

    /**
     * @param array<int, int|string> $bookingIds
     * @return array<string, array>
     */
    public function ratingsByBookings(array $bookingIds): array
    {
        $bookingIds = array_values(array_map(static fn ($id) => (string) $id, $bookingIds));

        if ($bookingIds === []) {
            return [];
        }

        try {
            $data = InternalClient::for('catalog')
                ->post('/internal/ratings/by-bookings', ['booking_ids' => $bookingIds]);
        } catch (Throwable) {
            return [];
        }

        $ratings = $data['ratings'] ?? $data['data'] ?? [];

        return is_array($ratings) ? $ratings : [];
    }

    /**
     * @param array<int, string> $barbershopIds
     * @return array<string, array>
     */
    public function barbershopSummaries(array $barbershopIds): array
    {
        $barbershopIds = array_values(array_unique(array_map(static fn ($id) => (string) $id, $barbershopIds)));

        if ($barbershopIds === []) {
            return [];
        }

        try {
            $data = InternalClient::for('catalog')
                ->post('/internal/barbershops/batch', ['ids' => $barbershopIds]);
        } catch (Throwable) {
            return [];
        }

        $shops = $data['barbershops'] ?? [];

        return is_array($shops) ? $shops : [];
    }

    private function fetchBarbershop(string $path): ?array
    {
        try {
            $data = InternalClient::for('catalog')->get($path);
        } catch (Throwable) {
            return null;
        }

        $shop = $data['barbershop'] ?? $data;

        return is_array($shop) && isset($shop['id']) ? $shop : null;
    }

    public static function statusOf(Throwable $e): int
    {
        if (preg_match('/failed with status (\d{3})/', $e->getMessage(), $matches) === 1) {
            return (int) $matches[1];
        }

        return 0;
    }
}
