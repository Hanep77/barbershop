<?php

namespace Database\Seeders;

use App\Models\Barbershop;
use App\Models\Booking;
use App\Models\Capster;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class BookingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = User::where('role', 'customer')->get();
        $barbershops = Barbershop::all();

        $statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

        for ($i = 0; $i < 80; $i++) { // Create 80 bookings
            $customer = $customers->random();
            $barbershop = $barbershops->random();
            $service = Service::where('barbershop_id', $barbershop->id)->inRandomOrder()->first();
            $capster = Capster::where('barbershop_id', $barbershop->id)->inRandomOrder()->first();

            if (!$service || !$capster) continue;

            // Random date: past, today, future
            $dateType = rand(1, 3);
            if ($dateType == 1) {
                $bookingDate = Carbon::now()->subDays(rand(1, 30));
            } elseif ($dateType == 2) {
                $bookingDate = Carbon::now();
            } else {
                $bookingDate = Carbon::now()->addDays(rand(1, 14));
            }

            // Random time between open and close
            $openTime = Carbon::createFromTimeString($barbershop->open_time);
            $closeTime = Carbon::createFromTimeString($barbershop->close_time);
            $bookingTime = $openTime->copy()->addMinutes(rand(0, $closeTime->diffInMinutes($openTime) - 60));

            // Status distribution: more completed and confirmed
            $statusWeights = ['pending' => 10, 'confirmed' => 25, 'completed' => 50, 'cancelled' => 15];
            $status = $this->weightedRandom($statusWeights);

            Booking::create([
                'user_id' => $customer->id,
                'barbershop_id' => $barbershop->id,
                'service_id' => $service->id,
                'capster_id' => $capster->id,
                'booking_date' => $bookingDate->toDateString(),
                'booking_time' => $bookingTime->toTimeString(),
                'status' => $status,
            ]);
        }
    }

    private function weightedRandom($weights)
    {
        $totalWeight = array_sum($weights);
        $random = rand(1, $totalWeight);

        foreach ($weights as $item => $weight) {
            $random -= $weight;
            if ($random <= 0) {
                return $item;
            }
        }
    }
}
