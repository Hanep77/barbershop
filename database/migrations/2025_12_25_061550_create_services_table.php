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
        Schema::create('services', function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->foreignUuid("barbershop_id")->constrained()->onDelete('cascade');
            $table->string("name", 100);
            $table->string("description")->nullable();
            $table->foreignUuid("category_id")->constrained("service_categories")->onDelete('cascade');
            $table->decimal("price");
            $table->integer("duration_minutes");
            $table->boolean("is_active")->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
