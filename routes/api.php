<?php

use App\Http\Controllers\BarbershopController;
use App\Http\Controllers\PartnerBarbershopController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceCategoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CapsterController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\WithdrawalController;
use Illuminate\Http\Request;
use App\Http\Controllers\RatingController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NotificationController;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

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
Route::get("/barbershop/{barbershop}/ratings", [RatingController::class, "index"]);
Route::post('/payments/webhook/xendit', [PaymentController::class, 'webhook']);
Route::post('/xendit/refund-webhook', [PaymentController::class, 'handleRefundWebhook']);

Route::middleware("auth:sanctum")->group(function () {
    Route::post("/user", [UserController::class, "me"]);

    Route::get("/bookings", [BookingController::class, "index"]);
    Route::post("/bookings", [BookingController::class, "store"]);
    Route::post("/ratings", [RatingController::class, "store"]);
    Route::put("/ratings/{rating}", [RatingController::class, "update"]);
    Route::delete("/ratings/{rating}", [RatingController::class, "destroy"]);

    Route::get("/notifications", [NotificationController::class, "index"]);
    Route::get("/notifications/unread-count", [NotificationController::class, "unreadCount"]);
    Route::post("/notifications/{notification}/read", [NotificationController::class, "markAsRead"]);
    Route::post("/notifications/read-all", [NotificationController::class, "markAllAsRead"]);

    // Barbershop management
    Route::post("/barbershop", [BarbershopController::class, "store"]);
    Route::put("/barbershop/{barbershop}", [BarbershopController::class, "update"]);
    Route::delete("/barbershop/{barbershop}", [BarbershopController::class, "destroy"]);

    Route::middleware("role:barbershop")->prefix('/partner')->group(function () {

        Route::prefix("/barbershop")->group(function () {
            Route::get('/', [PartnerBarbershopController::class, 'index']);
            Route::put('/', [PartnerBarbershopController::class, 'update']);

            // Dashboard routes
            Route::get('/dashboard/stats', [PartnerBarbershopController::class, 'dashboardStats']);
            Route::get('/dashboard/today-appointments', [PartnerBarbershopController::class, 'todayAppointments']);
            Route::get('/dashboard/recent-bookings', [PartnerBarbershopController::class, 'recentBookings']);

            Route::resource('/services', ServiceController::class);
            Route::resource('/service-categories', ServiceCategoryController::class);
            Route::resource('/capsters', CapsterController::class);
            Route::post('/capsters/{capster}/toggle-status', [CapsterController::class, 'toggleStatus']);

            Route::get('/bookings', [BookingController::class, 'partnerIndex']);
            Route::put('/bookings/{booking}/status', [BookingController::class, 'updateStatus']);

            Route::get('/withdrawals', [WithdrawalController::class, 'index']);
            Route::post('/withdrawals', [WithdrawalController::class, 'store']);
        });
    });

    Route::put("/barbershop/services/{service}", [ServiceController::class, "update"]);
    Route::delete("/barbershop/services/{service}", [ServiceController::class, "destroy"]);

    // Bookings
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancelBooking']);

    // Payments
    Route::get('/payments/detail/{id}', [PaymentController::class, 'show']);
    Route::get('/payments/{bookingId}', [PaymentController::class, 'getByBooking']);
    Route::post('/payments/create', [PaymentController::class, 'create']);
});
