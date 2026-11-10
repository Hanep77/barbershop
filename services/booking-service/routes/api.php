<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\PartnerBookingController;
use App\Http\Controllers\PartnerDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/barbershop/{barbershop}/available-slots', [BookingController::class, 'getAvailableSlots']);

Route::middleware('jwt')->group(function () {
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store'])->middleware('role:customer');
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancelBooking']);

    Route::middleware('role:barbershop')->prefix('/partner/barbershop')->group(function () {
        Route::get('/bookings', [PartnerBookingController::class, 'index']);
        Route::put('/bookings/{booking}/status', [PartnerBookingController::class, 'updateStatus']);
        Route::post('/bookings/{booking}/cancel', [PartnerBookingController::class, 'cancel']);

        Route::get('/dashboard/stats', [PartnerDashboardController::class, 'stats']);
        Route::get('/dashboard/today-appointments', [PartnerDashboardController::class, 'todayAppointments']);
        Route::get('/dashboard/recent-bookings', [PartnerDashboardController::class, 'recentBookings']);
    });
});

