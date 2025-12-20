<?php

use App\Http\Controllers\BarbershopController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/* Route::get('/user', function (Request $request) { */
/*     return $request->user(); */
/* })->middleware('auth:sanctum'); */

Route::post("/register", [UserController::class, "register"]);
Route::post("/login", [UserController::class, "login"]);

Route::middleware("auth:sanctum")->group(function () {
    Route::post("/logout", [UserController::class, "logout"]);
    Route::post("/barbershop", [BarbershopController::class, "store"]);
});
