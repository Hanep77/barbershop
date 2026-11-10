<?php

namespace App\Support;

use Throwable;

/**
 * Resolves a barbershop owned by a partner via the catalog service.
 */
final class BarbershopResolver
{
    public function byOwner(string $ownerId): ?array
    {
        try {
            $response = InternalClient::for('catalog')->get('/internal/barbershops/by-owner/'.rawurlencode($ownerId));
        } catch (Throwable) {
            return null;
        }

        $shop = $response['barbershop']
            ?? data_get($response, 'data.barbershop')
            ?? $response['data']
            ?? $response;

        if (! is_array($shop) || empty($shop['id'])) {
            return null;
        }

        return $shop;
    }
}
