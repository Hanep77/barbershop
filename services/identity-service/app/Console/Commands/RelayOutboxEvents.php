<?php

namespace App\Console\Commands;

use App\Support\Outbox\EventPublisher;
use App\Support\Outbox\OutboxEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Throwable;

class RelayOutboxEvents extends Command
{
    protected $signature = 'events:relay {--limit=100 : Maximum events per iteration}';

    protected $description = 'Relay transactional outbox rows to the Redis Streams event bus';

    public function handle(): int
    {
        $limit = max(1, (int) $this->option('limit'));

        $events = OutboxEvent::query()
            ->whereNull('relayed_at')
            ->orderBy('occurred_at')
            ->limit($limit)
            ->get();

        $relayed = 0;

        foreach ($events as $event) {
            try {
                Redis::xadd(EventPublisher::STREAM, '*', [
                    'event_id' => $event->id,
                    'type' => $event->type,
                    'payload' => json_encode($event->payload, JSON_THROW_ON_ERROR),
                    'occurred_at' => $event->occurred_at->toIso8601String(),
                ]);

                $event->forceFill(['relayed_at' => now(), 'last_error' => null])->save();
                $relayed++;
            } catch (Throwable $e) {
                $event->forceFill([
                    'attempts' => $event->attempts + 1,
                    'last_error' => mb_substr($e->getMessage(), 0, 1000),
                ])->save();

                Log::error('Outbox relay failed', [
                    'event_id' => $event->id,
                    'type' => $event->type,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Relayed {$relayed} event(s).");

        return self::SUCCESS;
    }
}
