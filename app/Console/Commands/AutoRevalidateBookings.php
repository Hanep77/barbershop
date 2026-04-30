<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Transaction;

class AutoRevalidateBookings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:auto-revalidate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        Transaction::where('status', 'confirmed')
            ->whereRaw("TIMESTAMP(booking_date, start_time) < ?", [now()->subMinutes(15)])
            ->update([
                'status' => 'cancelled',
                'cancellation_reason' => 'No-show: customer exceeded late tolerance',
                'refund_amount' => 0,
            ]);
    }
}
