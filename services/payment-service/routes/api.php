<?php

use App\Http\Controllers\BalanceController;
use App\Http\Controllers\InternalPaymentController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\WithdrawalController;
use Illuminate\Support\Facades\Route;

Route::post('/payments/webhook/xendit', [PaymentController::class, 'webhook']);
Route::post('/xendit/refund-webhook', [PaymentController::class, 'handleRefundWebhook']);
Route::post('/xendit/payout-webhook', [WithdrawalController::class, 'updateBalanceViaWebhook']);

Route::middleware('jwt')->group(function () {
    Route::post('/payments/create', [PaymentController::class, 'create']);
    Route::get('/payments/detail/{id}', [PaymentController::class, 'show']);
    Route::get('/payments/{bookingId}', [PaymentController::class, 'getByBooking']);

    Route::middleware('role:barbershop')->prefix('/partner/barbershop')->group(function () {
        Route::get('/withdrawals', [WithdrawalController::class, 'index']);
        Route::post('/withdrawals', [WithdrawalController::class, 'store']);
        Route::get('/balance', [BalanceController::class, 'show']);
    });
});

