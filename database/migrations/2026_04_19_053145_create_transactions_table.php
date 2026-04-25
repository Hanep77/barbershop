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
            $table->foreignId("booking_id")->constrained()->onDelete('cascade');
            $table->dateTime('booking_date');
            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending');
            $table->decimal('total_price', 8, 2);
            $table->foreignUuid('service_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('capster_id')->constrained()->onDelete('cascade');
            $table->time('start_time')->after('booking_date');
            $table->time('end_time')->after('start_time');
            $table->text('cancellation_reason')->nullable()->after('status');
            $table->decimal('refund_amount', 8, 2)->default(0);
            $table->decimal('amount', 8, 2);
            $table->enum('status', ['pending', 'success', 'failed'])->default('pending');
            $table->string("payment_method");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
