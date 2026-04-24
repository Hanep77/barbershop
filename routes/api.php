<?php

use App\Http\Controllers\BarbershopController;
use App\Http\Controllers\PartnerBarbershopController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceCategoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CapsterController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\PaymentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post("/register", [UserController::class, "register"]);
Route::post("/login", [UserController::class, "login"]);

Route::middleware("auth:sanctum")->group(function () {
    Route::post("/user", [UserController::class, "me"]);

    // Route::resouece("/barbershop", BarbershopController::class);
    Route::get("/barbershop", [BarbershopController::class, "index"]);
    Route::post("/barbershop", [BarbershopController::class, "store"]);
    Route::get("/barbershop/{barbershop}", [BarbershopController::class, "show"]);
    Route::put("/barbershop/{barbershop}", [BarbershopController::class, "update"]);
    Route::delete("/barbershop/{barbershop}", [BarbershopController::class, "destroy"]);

    Route::middleware("role:barbershop")->prefix('/partner')->group(function () {

        Route::prefix("/barbershop")->group(function () {
            Route::get('/', [PartnerBarbershopController::class, 'index']);
            Route::put('/', [PartnerBarbershopController::class, 'update']);
            Route::resource('/services', ServiceController::class);
            Route::resource('/service-categories', ServiceCategoryController::class);
            Route::resource('/capsters', CapsterController::class);
        });
    });

    Route::get("/barbershop/{barbershop}/services", [ServiceController::class, "index"]);
    Route::put("/barbershop/services/{service}", [ServiceController::class, "update"]);
    Route::delete("/barbershop/services/{service}", [ServiceController::class, "destroy"]);

    // Bookings
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);

    // Payments
    Route::get('/payments/{id}', [PaymentController::class, 'show']);
    Route::post('/payments/webhook/xendit', [PaymentController::class, 'webhook']);
});
