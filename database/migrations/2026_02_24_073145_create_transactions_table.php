<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('barbershop_id')->constrained()->onDelete('cascade');
            $table->dateTime('booking_date');
            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending');
            $table->decimal('total_price', 8, 2);
            $table->foreignUuid('service_id')->constrained()->onDelete('cascade')->after('barbershop_id');
            $table->foreignUuid('capster_id')->constrained()->onDelete('cascade')->after('service_id');
            $table->time('start_time')->after('booking_date');
            $table->time('end_time')->after('start_time');
            $table->text('cancellation_reason')->nullable()->after('status');
            $table->decimal('refund_amount', 8, 2)->default(0)->after('cancellation_reason');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropForeign(['capster_id']);
            $table->dropColumn(['service_id', 'capster_id', 'start_time', 'end_time', 'cancellation_reason', 'refund_amount']);
        });
    }
};
