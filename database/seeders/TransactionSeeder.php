<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $bookings = Booking::whereIn('status', ['confirmed', 'completed'])->get();

        foreach ($bookings as $booking) {
            $service = $booking->service;
            $capster = $booking->capster;

            $startTime = Carbon::createFromFormat('Y-m-d H:i', $booking->booking_date->format('Y-m-d') . ' ' . $booking->booking_time->format('H:i'));
            $endTime = $startTime->copy()->addMinutes($service->duration_minutes);

            $status = $booking->status == 'completed' ? 'confirmed' : 'pending';

            Transaction::create([
                'booking_id' => $booking->id,
                'booking_date' => $startTime,
                'status' => $status,
                'total_price' => $service->price,
                'service_id' => $service->id,
                'capster_id' => $capster->id,
                'start_time' => $startTime->format('H:i:s'),
                'end_time' => $endTime->format('H:i:s'),
                'amount' => $service->price,
                'payment_method' => collect(['cash', 'transfer', 'e-wallet'])->random(),
            ]);
        }
    }
}
