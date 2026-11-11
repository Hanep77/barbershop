<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the fixed-id demo bookings.
 *
 * Booking ids are explicit (1..DemoFixtures::BOOKING_COUNT) because catalog
 * ratings and payment rows reference them across service boundaries. The
 * id sequence is resynchronized afterwards so user-created bookings do not
 * collide with the demo rows.
 */
class BookingSeeder extends Seeder
{
    public function run(): void
    {
        foreach (DemoFixtures::bookings() as $booking) {
            $refunded = (bool) $booking['refunded'];

            DB::table('bookings')->updateOrInsert(
                ['id' => $booking['id']],
                [
                    'user_id' => $booking['user_id'],
                    'user_name' => $booking['user_name'],
                    'user_email' => $booking['user_email'],
                    'barbershop_id' => $booking['shop_id'],
                    'barbershop_name' => $booking['shop_name'],
                    'barbershop_owner_id' => $booking['owner_id'],
                    'service_id' => $booking['service_id'],
                    'service_name' => $booking['service_name'],
                    'service_price' => $booking['service_price'],
                    'service_duration_minutes' => $booking['service_duration'],
                    'capster_id' => $booking['capster_id'],
                    'capster_name' => $booking['capster_name'],
                    'booking_date' => $booking['booking_date'],
                    'booking_time' => $booking['booking_time'].':00',
                    'status' => $booking['status'],
                    'total_price' => $booking['service_price'],
                    'refund_amount' => $refunded ? $booking['service_price'] : 0,
                    'refund_status' => $refunded ? 'success' : 'none',
                    'cancellation_reason' => $booking['status'] === 'cancelled'
                        ? 'Jadwal bentrok dengan agenda lain.'
                        : null,
                    'cancelled_by' => $booking['status'] === 'cancelled' ? 'customer' : null,
                    'created_at' => $booking['created_at'],
                    'updated_at' => $booking['created_at'],
                ],
            );
        }

        $this->syncIdSequence();
    }

    private function syncIdSequence(): void
    {
        $max = (int) DB::table('bookings')->max('id');

        match (DB::getDriverName()) {
            'pgsql' => DB::statement(
                "SELECT setval(pg_get_serial_sequence('bookings', 'id'), GREATEST(?, 1), true)",
                [$max],
            ),
            'mysql', 'mariadb' => DB::statement('ALTER TABLE bookings AUTO_INCREMENT = '.($max + 1)),
            default => null,
        };
    }
}
