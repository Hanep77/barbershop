<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Rating;
use Illuminate\Database\Seeder;

class RatingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $completedBookings = Booking::where('status', 'completed')->get();

        if ($completedBookings->isEmpty()) {
            return;
        }

        // Create ratings for about 60% of completed bookings
        $countToRate = (int)($completedBookings->count() * 0.6);
        $bookingsToRate = $completedBookings->random($countToRate > 0 ? $countToRate : 0);

        foreach ($bookingsToRate as $booking) {
            // Bias towards higher ratings
            $ratingValue = $this->weightedRatingRandom();

            \App\Models\Rating::create([
                'user_id' => $booking->user_id,
                'barbershop_id' => $booking->barbershop_id,
                'capster_id' => $booking->capster_id, // Link to capster from booking
                'booking_id' => $booking->id,
                'rating' => $ratingValue,
                'comment' => $this->generateComment($ratingValue),
            ]);
        }

        // Recalculate average ratings for all barbershops
        \App\Models\Barbershop::all()->each(function ($shop) {
            $avg = \App\Models\Rating::where('barbershop_id', $shop->id)->avg('rating') ?: 0;
            $shop->update(['rating' => $avg]);
        });

        // Recalculate average ratings for all capsters
        \App\Models\Capster::all()->each(function ($capster) {
            $avg = \App\Models\Rating::where('capster_id', $capster->id)->avg('rating') ?: 0;
            $capster->update(['rating' => $avg]);
        });
    }

    private function weightedRatingRandom()
    {
        $weights = [1 => 5, 2 => 10, 3 => 20, 4 => 35, 5 => 30];
        $totalWeight = array_sum($weights);
        $random = rand(1, $totalWeight);

        foreach ($weights as $rating => $weight) {
            $random -= $weight;
            if ($random <= 0) {
                return $rating;
            }
        }
    }

    private function generateComment($rating)
    {
        $comments = [
            1 => ['Terrible service, not recommended.', 'Very disappointed with the experience.'],
            2 => ['Below expectations.', 'Could be better.'],
            3 => ['Average service.', 'Nothing special.'],
            4 => ['Good service, satisfied.', 'Nice experience.'],
            5 => ['Excellent service!', 'Highly recommended!', 'Amazing experience!'],
        ];

        return collect($comments[$rating])->random();
    }
}
