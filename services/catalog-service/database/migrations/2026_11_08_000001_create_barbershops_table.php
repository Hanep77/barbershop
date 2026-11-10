<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barbershops', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // External identity id. No cross-service foreign key by design.
            $table->uuid('user_id')->unique();
            $table->string('name', 100);
            $table->text('address');
            $table->string('map_url')->nullable();
            $table->string('phone_number', 15);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('latitude');
            $table->string('longitude');
            $table->decimal('rating', 3, 2)->default(0);
            $table->time('open_time')->default('09:00');
            $table->time('close_time')->default('21:00');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barbershops');
    }
};
