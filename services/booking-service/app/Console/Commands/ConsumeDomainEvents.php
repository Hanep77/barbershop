<?php

namespace App\Console\Commands;

use App\Services\BookingService;
use App\Support\Events\StreamConsumer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ConsumeDomainEvents extends Command
{
    protected $signature = 'events:consume {group} {--once : Process at most one batch} {--consumer= : Consumer name}';

    protected $description = 'Consume booking domain events from Redis Streams';

    public function handle(BookingService $bookings): int
    {
        $group = (string) $this->argument('group');
        $consumer = (string) ($this->option('consumer') ?: gethostname().'-'.getmypid());

        if ($group !== 'booking') {
            $this->error("This service only consumes the [booking] group, got [{$group}].");

            return self::FAILURE;
        }

        $runner = new StreamConsumer($group, $this->handlers($bookings), $consumer);

        do {
            try {
                $processed = $runner->runOnce();
            } catch (\Throwable $e) {
                Log::error('Event consumer loop failed', ['error' => $e->getMessage()]);
                $this->error($e->getMessage());

                return self::FAILURE;
            }
        } while (! $this->option('once') && $processed > 0);

        return self::SUCCESS;
    }

    /**
     * Handlers stay thin; all state transitions live in BookingService so
     * they can be unit-tested without Redis.
     *
     * @return array<string, callable(array):void>
     */
    private function handlers(BookingService $bookings): array
    {
        return [
            'PaymentSucceeded' => static function (array $event) use ($bookings): void {
                $bookings->applyPaymentSucceeded($event);
            },

            'PaymentFailed' => static function (array $event) use ($bookings): void {
                $bookings->applyPaymentFailed($event);
            },

            'RefundSucceeded' => static function (array $event) use ($bookings): void {
                $bookings->applyRefundSucceeded($event);
            },

            'RefundFailed' => static function (array $event) use ($bookings): void {
                $bookings->applyRefundFailed($event);
            },
        ];
    }
}
