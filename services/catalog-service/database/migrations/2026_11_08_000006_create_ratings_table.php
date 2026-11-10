<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ratings', function (Blueprint $table) {
            $table->bigIncrements('id');
            // External identity id, plus name/avatar snapshots. No identity FK.
            $table->uuid('user_id');
            $table->string('user_name');
            $table->string('user_avatar')->nullable();
            $table->uuid('barbershop_id');
            $table->uuid('capster_id')->nullable();
            // External booking id owned by the booking service.
            $table->unsignedBigInteger('booking_id')->unique();
            $table->integer('rating');
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->index('barbershop_id');
            $table->index('capster_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};
