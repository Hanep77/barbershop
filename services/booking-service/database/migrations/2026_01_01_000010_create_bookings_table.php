<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('user_id')->index();
            $table->string('user_name');
            $table->string('user_email');
            $table->uuid('barbershop_id')->index();
            $table->string('barbershop_name');
            $table->uuid('barbershop_owner_id')->index();
            $table->uuid('service_id');
            $table->string('service_name');
            $table->decimal('service_price', 12, 2);
            $table->unsignedInteger('service_duration_minutes');
            $table->uuid('capster_id')->index();
            $table->string('capster_name');
            $table->date('booking_date');
            $table->time('booking_time');
            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled'])->default('pending');
            $table->decimal('total_price', 12, 2)->default(0);
            $table->decimal('refund_amount', 12, 2)->default(0);
            $table->enum('refund_status', ['none', 'pending', 'success', 'failed'])->default('none');
            $table->text('cancellation_reason')->nullable();
            $table->string('cancelled_by')->nullable();
            $table->timestamps();

            $table->index(['capster_id', 'booking_date']);
            $table->index(['barbershop_id', 'booking_date']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
