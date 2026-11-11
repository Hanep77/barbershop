<?php

namespace Database\Seeders;

use App\Models\Barbershop;
use App\Models\Capster;
use App\Models\Rating;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

/**
 * Seeds reviews for completed demo bookings (the booking ids are the fixed
 * ones from DemoFixtures), then refreshes the denormalized rating averages.
 */
class RatingSeeder extends Seeder
{
    public function run(): void
    {
        foreach (DemoFixtures::bookings() as $booking) {
            if ($booking['rating'] === null) {
                continue;
            }

            $reviewedAt = Carbon::parse($booking['booking_date'].' '.$booking['booking_time'])->addHours(2);

            Rating::query()->updateOrCreate(
                ['booking_id' => $booking['id']],
                [
                    'user_id' => $booking['user_id'],
                    'user_name' => $booking['user_name'],
                    'user_avatar' => null,
                    'barbershop_id' => $booking['shop_id'],
                    'capster_id' => $booking['capster_id'],
                    'rating' => $booking['rating'],
                    'comment' => $booking['comment'],
                    'created_at' => $reviewedAt,
                    'updated_at' => $reviewedAt,
                ],
            );
        }

        $this->refreshAverages();
    }

    private function refreshAverages(): void
    {
        foreach (DemoFixtures::shops() as $shop) {
            $shopId = DemoFixtures::id($shop['key']);
            $average = (float) Rating::query()->where('barbershop_id', $shopId)->avg('rating');

            Barbershop::query()->whereKey($shopId)->update([
                'rating' => round($average, 2),
            ]);

            foreach ($shop['capsters'] as $capster) {
                $capsterId = DemoFixtures::id($capster['key']);
                $capsterAverage = Rating::query()->where('capster_id', $capsterId)->avg('rating');

                Capster::query()->whereKey($capsterId)->update([
                    'rating' => round((float) ($capsterAverage ?: $capster['rating']), 2),
                ]);
            }
        }
    }
}
