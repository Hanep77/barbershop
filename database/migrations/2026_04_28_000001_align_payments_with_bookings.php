<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('payments', 'payment_url')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->string('payment_url')->nullable()->after('payment_method');
            });
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE payments MODIFY booking_id BIGINT UNSIGNED NOT NULL');
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('booking_id')->references('id')->on('bookings')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE payments MODIFY booking_id CHAR(36) NOT NULL');
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('booking_id')->references('id')->on('transactions')->cascadeOnDelete();
            $table->dropColumn('payment_url');
        });
    }
};
