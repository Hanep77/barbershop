<?php

use App\Http\Controllers\InternalUserController;
use Illuminate\Support\Facades\Route;

Route::get('/users/{id}', [InternalUserController::class, 'show']);
Route::post('/users/batch', [InternalUserController::class, 'batch']);
Route::patch('/users/{id}/role', [InternalUserController::class, 'updateRole']);
