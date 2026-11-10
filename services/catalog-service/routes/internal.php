<?php

use App\Http\Controllers\InternalCatalogController;
use App\Http\Controllers\InternalRatingController;
use Illuminate\Support\Facades\Route;

Route::get('/barbershops/by-owner/{userId}', [InternalCatalogController::class, 'byOwner']);
Route::post('/barbershops/batch', [InternalCatalogController::class, 'batch']);
Route::get('/barbershops/{id}/stats', [InternalCatalogController::class, 'stats']);
Route::get('/barbershops/{id}', [InternalCatalogController::class, 'showBarbershop']);
Route::get('/services/{id}', [InternalCatalogController::class, 'showService']);
Route::get('/capsters/{id}', [InternalCatalogController::class, 'showCapster']);
Route::post('/catalog/validate-booking', [InternalCatalogController::class, 'validateBooking']);
Route::post('/ratings/by-bookings', [InternalRatingController::class, 'byBookings']);