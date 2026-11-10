<?php

use App\Http\Controllers\InternalPaymentController;
use Illuminate\Support\Facades\Route;

Route::get('/payments/by-booking/{bookingId}', [InternalPaymentController::class, 'byBooking']);
Route::post('/payments/by-bookings', [InternalPaymentController::class, 'byBookings']);
Route::post('/payments/refund', [InternalPaymentController::class, 'refund']);
Route::get('/payments/stats/{barbershopId}', [InternalPaymentController::class, 'stats']);
Route::get('/balances/{barbershopId}', [InternalPaymentController::class, 'balance']);