<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('booking_id')->unique();
            $table->uuid('user_id')->index();
            $table->uuid('barbershop_id')->index();
            $table->uuid('barbershop_owner_id')->index();
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['pending', 'success', 'failed'])->default('pending');
            $table->string('payment_method')->nullable();
            $table->string('payment_url')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('xendit_payment_id')->nullable();
            $table->string('external_id')->nullable()->unique();
            $table->enum('refund_status', ['none', 'pending', 'success', 'failed'])->default('none');
            $table->decimal('refund_amount', 12, 2)->default(0);
            $table->string('refund_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
