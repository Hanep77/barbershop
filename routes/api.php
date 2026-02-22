<?php

use App\Http\Controllers\BarbershopController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post("/register", [UserController::class, "register"]);
Route::post("/login", [UserController::class, "login"]);

Route::middleware("auth:sanctum")->group(function () {
    Route::post("/logout", [UserController::class, "logout"]);

    Route::get("/barbershop", [BarbershopController::class, "index"]);
    Route::post("/barbershop", [BarbershopController::class, "store"]);
    Route::get("/barbershop/{barbershop}", [BarbershopController::class, "show"]);
    Route::put("/barbershop/{barbershop}", [BarbershopController::class, "update"]);
    Route::delete("/barbershop/{barbershop}", [BarbershopController::class, "destroy"]);

    Route::get("/barbershop/{barbershop}/services", [ServiceController::class, "index"]);
    Route::post("/barbershop/{barbershop}/services", [ServiceController::class, "store"]);
    Route::put("/barbershop/services/{service}", [ServiceController::class, "update"]);
    Route::delete("/barbershop/services/{service}", [ServiceController::class, "destroy"]);
});
