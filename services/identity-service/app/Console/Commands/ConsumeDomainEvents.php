<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\NotificationService;
use App\Support\Events\StreamConsumer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ConsumeDomainEvents extends Command
{
    protected $signature = 'events:consume {group} {--once : Process at most one batch} {--consumer= : Consumer name}';

    protected $description = 'Consume domain events from Redis Streams';

    public function handle(): int
    {
        $group = (string) $this->argument('group');
        $consumer = (string) ($this->option('consumer') ?: gethostname().'-'.getmypid());

        if ($group !== 'identity') {
            $this->error("This service only consumes the [identity] group, got [{$group}].");

            return self::FAILURE;
        }

        $consumerRunner = new StreamConsumer($group, $this->handlers(), $consumer);

        do {
            try {
                $processed = $consumerRunner->runOnce();
            } catch (\Throwable $e) {
                Log::error('Event consumer loop failed', ['error' => $e->getMessage()]);
                $this->error($e->getMessage());

                return self::FAILURE;
            }
        } while (! $this->option('once') && $processed > 0);

        return self::SUCCESS;
    }

    /**
     * @return array<string, callable(array):void>
     */
    private function handlers(): array
    {
        return [
            'BarbershopCreated' => function (array $event): void {
                $user = User::query()->find((string) ($event['user_id'] ?? ''));

                if ($user && $user->role !== 'barbershop') {
                    $user->update(['role' => 'barbershop']);
                }
            },

            'BookingCreated' => function (array $event): void {
                NotificationService::send(
                    (string) $event['barbershop_owner_id'],
                    'New Booking Alert!',
                    "New booking from {$event['user_name']} for {$event['service_name']} on {$event['booking_date']} at {$event['booking_time']}.",
                    'booking_created',
                );
            },

            'BookingCancelled' => function (array $event): void {
                $date = (string) $event['booking_date'];

                NotificationService::send(
                    (string) $event['user_id'],
                    'Booking Cancelled',
                    "Your booking at {$event['barbershop_name']} on {$date} has been cancelled.",
                    'booking_cancelled',
                );

                NotificationService::send(
                    (string) $event['barbershop_owner_id'],
                    'Booking Cancelled',
                    "Booking from {$event['user_name']} on {$date} has been cancelled.",
                    'booking_cancelled',
                );
            },

            'BookingStatusChanged' => function (array $event): void {
                $status = (string) $event['status'];

                // Cancellation already has its own event/notification.
                if ($status === 'cancelled') {
                    return;
                }

                NotificationService::send(
                    (string) $event['user_id'],
                    'Booking '.ucfirst($status),
                    "Your booking for {$event['service_name']} at {$event['barbershop_name']} is now {$status}.",
                    'booking_'.$status,
                );

                if ($status === 'completed') {
                    NotificationService::send(
                        (string) $event['user_id'],
                        'Layanan Selesai!',
                        "Layanan Anda di {$event['barbershop_name']} telah selesai. Berikan ulasan Anda sekarang!",
                        'booking_completed_review',
                    );
                }
            },

            'ReviewCreated' => function (array $event): void {
                NotificationService::send(
                    (string) $event['barbershop_owner_id'],
                    'New Review Received!',
                    "Your shop just received a {$event['rating']}-star review from {$event['user_name']}.",
                    'review_created',
                );
            },

            'PaymentSucceeded' => function (array $event): void {
                NotificationService::send(
                    (string) $event['user_id'],
                    'Payment Successful',
                    'Payment for your booking has been confirmed.',
                    'payment_success',
                );
            },

            'PaymentFailed' => function (array $event): void {
                NotificationService::send(
                    (string) $event['user_id'],
                    'Payment Failed',
                    'Payment for your booking failed or expired.',
                    'payment_failed',
                );
            },

            'WithdrawalSucceeded' => function (array $event): void {
                NotificationService::send(
                    (string) $event['barbershop_owner_id'],
                    'Withdraw Berhasil!',
                    'Withdraw sebesar IDR '.number_format((float) $event['amount'], 0, ',', '.').' telah berhasil diproses.',
                    'withdraw_success',
                );
            },

            'WithdrawalFailed' => function (array $event): void {
                NotificationService::send(
                    (string) $event['barbershop_owner_id'],
                    'Withdraw Gagal',
                    'Withdraw sebesar IDR '.number_format((float) $event['amount'], 0, ',', '.').' gagal diproses: '.($event['reason'] ?? 'Unknown error'),
                    'withdraw_failed',
                );
            },
        ];
    }
}
