<?php

use App\Http\Controllers\BarbershopController;
use App\Http\Controllers\PartnerBarbershopController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceCategoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CapsterController;
use App\Http\Controllers\BookingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post("/register", [UserController::class, "register"]);
Route::post("/login", [UserController::class, "login"]);

Route::get("/barbershop", [BarbershopController::class, "index"]);
Route::get("/barbershop/{barbershop}", [BarbershopController::class, "show"]);
Route::get("/barbershop/{barbershop}/services", [ServiceController::class, "index"]);
Route::get("/barbershop/{barbershop}/service-categories", [ServiceCategoryController::class, "index"]);
Route::get("/barbershop/{barbershop}/capsters", [CapsterController::class, "index"]);
Route::get("/barbershop/{barbershop}/available-slots", [BookingController::class, "getAvailableSlots"]);

Route::middleware("auth:sanctum")->group(function () {
    Route::post("/user", [UserController::class, "me"]);

    // Route::resouece("/barbershop", BarbershopController::class);
    Route::post("/barbershop", [BarbershopController::class, "store"]);
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

    Route::put("/barbershop/services/{service}", [ServiceController::class, "update"]);
    Route::delete("/barbershop/services/{service}", [ServiceController::class, "destroy"]);
});
