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
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('barbershop_id')->constrained('barbershops')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['pending', 'success', 'failed'])->default('pending');
            $table->string('bank_name');
            $table->string('account_number');
            $table->index('barbershop_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};
