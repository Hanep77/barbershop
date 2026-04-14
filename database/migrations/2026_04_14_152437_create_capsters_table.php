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
        Schema::create('capsters', function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->foreignUuid('barbershop_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('title');
            $table->string('experience');
            $table->decimal('rating', 3, 2);
            $table->json('specialties');
            $table->string('phone');
            $table->boolean("is_available")->default(true);
            $table->text('bio');
            $table->string('image')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('capsters');
    }
};
