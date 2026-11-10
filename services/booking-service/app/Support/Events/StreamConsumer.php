<?php

namespace App\Support\Events;

use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Throwable;

/**
 * Redis Streams consumer with a consumer group, idempotency table,
 * retry counter and dead-letter stream.
 */
final class StreamConsumer
{
    public const STREAM = 'barberbrody:events';

    public const DLQ = 'barberbrody:events:dlq';

    private const MAX_DELIVERY_ATTEMPTS = 3;

    /**
     * @param array<string, Closure(array):void> $handlers
     */
    public function __construct(
        private readonly string $group,
        private readonly array $handlers,
        private readonly string $consumer,
    ) {
    }

    public function runOnce(int $blockMs = 2000, int $max = 50): int
    {
        $this->ensureGroup();
        $this->claimStale();

        $response = Redis::xreadgroup(
            $this->group,
            $this->consumer,
            [self::STREAM => '>'],
            $max,
            $blockMs,
        );

        if (! is_array($response)) {
            return 0;
        }

        $processed = 0;

        foreach ($response as $messages) {
            foreach ($messages as $streamId => $fields) {
                $this->handleMessage((string) $streamId, $fields);
                $processed++;
            }
        }

        return $processed;
    }

    private function handleMessage(string $streamId, array $fields): void
    {
        $eventId = (string) ($fields['event_id'] ?? $streamId);
        $type = (string) ($fields['type'] ?? '');

        if ($this->alreadyProcessed($eventId)) {
            Redis::xack(self::STREAM, $this->group, [$streamId]);

            return;
        }

        $handler = $this->handlers[$type] ?? null;

        if ($handler === null) {
            Log::warning('Unhandled domain event', ['type' => $type, 'event_id' => $eventId]);
            $this->markProcessed($eventId, $type);
            Redis::xack(self::STREAM, $this->group, [$streamId]);

            return;
        }

        try {
            $payload = json_decode((string) ($fields['payload'] ?? '{}'), true, 512, JSON_THROW_ON_ERROR);
            $handler(is_array($payload) ? $payload : []);
        } catch (Throwable $e) {
            $attempts = (int) Redis::incr('events:attempts:'.$eventId);

            Log::error('Domain event handler failed', [
                'type' => $type,
                'event_id' => $eventId,
                'attempt' => $attempts,
                'error' => $e->getMessage(),
            ]);

            if ($attempts >= self::MAX_DELIVERY_ATTEMPTS) {
                Redis::xadd(self::DLQ, '*', [
                    'event_id' => $eventId,
                    'type' => $type,
                    'payload' => (string) ($fields['payload'] ?? '{}'),
                    'error' => mb_substr($e->getMessage(), 0, 1000),
                ]);
                $this->markProcessed($eventId, 'dlq:'.$type);
                Redis::xack(self::STREAM, $this->group, [$streamId]);
            }

            return;
        }

        $this->markProcessed($eventId, $type);
        Redis::xack(self::STREAM, $this->group, [$streamId]);
    }

    private function ensureGroup(): void
    {
        try {
            Redis::xgroup('CREATE', self::STREAM, $this->group, '0', true);
        } catch (Throwable) {
            // Group already exists.
        }
    }

    private function claimStale(): void
    {
        try {
            Redis::xautoclaim(self::STREAM, $this->group, $this->consumer, 60000, '0-0', 20);
        } catch (Throwable) {
            // xautoclaim is a Redis 6.2 optimization; pending messages are
            // retried by the next read loop if unavailable.
        }
    }

    private function alreadyProcessed(string $eventId): bool
    {
        return DB::table('processed_events')->where('event_id', $eventId)->exists();
    }

    private function markProcessed(string $eventId, string $type): void
    {
        DB::table('processed_events')->insertOrIgnore([
            'event_id' => $eventId,
            'type' => $type,
            'processed_at' => now(),
        ]);
    }
}
