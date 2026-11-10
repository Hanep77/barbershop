<?php

namespace App\Console\Commands;

use App\Services\BookingService;
use Illuminate\Console\Command;

class AutoRevalidateBookings extends Command
{
    protected $signature = 'bookings:auto-revalidate';

    protected $description = 'Cancel confirmed bookings that passed the 15-minute no-show tolerance';

    public function handle(BookingService $bookings): int
    {
        $processed = $bookings->autoRevalidate();

        $this->info("Processed {$processed} no-show bookings.");

        return self::SUCCESS;
    }
}
