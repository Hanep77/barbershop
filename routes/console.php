<?php

// use Illuminate\Foundation\Inspiring;
// use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;


// Artisan::command('app:auto-revalidate-bookings', function () {
//     $this->call('App\Console\Commands\AutoRevalidateBookings');
// })->purpose('Automatically revalidate bookings that are past their start time and still confirmed');

Schedule::command('bookings:auto-revalidate')->everyMinute();
