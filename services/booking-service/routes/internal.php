<?php

use App\Http\Controllers\InternalBookingController;
use Illuminate\Support\Facades\Route;

Route::get('/bookings/{booking}', [InternalBookingController::class, 'show']);
Route::post('/bookings/{booking}/validate-review', [InternalBookingController::class, 'validateReview']);
Route::get('/bookings/by-barbershop/{barbershopId}/stats', [InternalBookingController::class, 'stats']);
Route::get('/bookings/by-barbershop/{barbershopId}/today', [InternalBookingController::class, 'today']);
Route::get('/bookings/by-barbershop/{barbershopId}/recent', [InternalBookingController::class, 'recent']);
