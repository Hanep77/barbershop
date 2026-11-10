<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('barbershop_id')->index();
            $table->uuid('barbershop_owner_id')->index();
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['pending', 'success', 'failed'])->default('pending');
            $table->string('bank_name');
            $table->string('account_name');
            $table->string('account_number');
            $table->string('external_id')->unique();
            $table->string('xendit_disbursement_id')->nullable();
            $table->string('xendit_status')->nullable();
            $table->string('failure_code')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->json('webhook_payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};
