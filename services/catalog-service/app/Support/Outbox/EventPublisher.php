<?php

namespace App\Support\Outbox;

use Illuminate\Support\Str;

/**
 * Publishes a domain event into the outbox.
 *
 * Call inside an existing database transaction so the event is only
 * visible when the business change commits.
 */
final class EventPublisher
{
    public const STREAM = 'barberbrody:events';

    public static function publish(string $type, array $payload): string
    {
        $id = (string) Str::uuid7();

        OutboxEvent::query()->create([
            'id' => $id,
            'type' => $type,
            'payload' => $payload,
            'occurred_at' => now(),
            'attempts' => 0,
        ]);

        return $id;
    }
}
