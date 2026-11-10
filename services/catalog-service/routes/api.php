<?php

use App\Http\Controllers\BarbershopController;
use App\Http\Controllers\BarbershopImageController;
use App\Http\Controllers\CapsterController;
use App\Http\Controllers\InternalCatalogController;
use App\Http\Controllers\InternalRatingController;
use App\Http\Controllers\PartnerBarbershopController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\ServiceCategoryController;
use App\Http\Controllers\ServiceController;
use Illuminate\Support\Facades\Route;

Route::get('/barbershop', [BarbershopController::class, 'index']);
Route::get('/barbershop/{barbershop}', [BarbershopController::class, 'show'])->whereUuid('barbershop');
Route::get('/barbershop/{barbershop}/images', [BarbershopImageController::class, 'publicIndex']);
Route::get('/barbershop/{barbershop}/services', [ServiceController::class, 'index']);
Route::get('/barbershop/{barbershop}/service-categories', [ServiceCategoryController::class, 'index']);
Route::get('/barbershop/{barbershop}/capsters', [CapsterController::class, 'index']);
Route::get('/barbershop/{barbershop}/ratings', [RatingController::class, 'index']);

Route::middleware('jwt')->group(function () {
    Route::post('/barbershop', [BarbershopController::class, 'store']);
    Route::put('/barbershop/{barbershop}', [BarbershopController::class, 'update']);
    Route::delete('/barbershop/{barbershop}', [BarbershopController::class, 'destroy']);

    Route::get('/barbershop/images', [BarbershopImageController::class, 'index']);
    Route::post('/barbershop/images', [BarbershopImageController::class, 'store']);
    Route::patch('/barbershop/images/{image}/set-primary', [BarbershopImageController::class, 'setPrimary']);
    Route::delete('/barbershop/images/{image}', [BarbershopImageController::class, 'destroy']);

    Route::put('/barbershop/services/{service}', [ServiceController::class, 'update']);
    Route::delete('/barbershop/services/{service}', [ServiceController::class, 'destroy']);

    Route::post('/ratings', [RatingController::class, 'store']);
    Route::put('/ratings/{rating}', [RatingController::class, 'update']);
    Route::delete('/ratings/{rating}', [RatingController::class, 'destroy']);

    Route::middleware('role:barbershop')->prefix('/partner/barbershop')->group(function () {
        Route::get('/', [PartnerBarbershopController::class, 'index']);
        Route::put('/', [PartnerBarbershopController::class, 'update']);

        Route::resource('/services', ServiceController::class)->except(['create', 'edit']);
        Route::resource('/service-categories', ServiceCategoryController::class)->except(['create', 'edit']);
        Route::resource('/capsters', CapsterController::class)->except(['create', 'edit']);
        Route::post('/capsters/{capster}/toggle-status', [CapsterController::class, 'toggleStatus']);
    });
});

