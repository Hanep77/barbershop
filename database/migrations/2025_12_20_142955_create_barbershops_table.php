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
        Schema::create('barbershops', function (Blueprint $table) {
            $table->uuid("id")->primary();
            $table->foreignUuid("user_id")->constrained()->unique();
            $table->string("name", 100);
            $table->text("address");
            $table->string("map_url")->nullable();
            $table->string("phone_number", 15);
            $table->text("description")->nullable();
            $table->boolean("is_active")->default(true);
            $table->string("latitude");
            $table->string("longitude");
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('rating', 3, 2)->default(0);
            $table->string('bank_name')->nullable();
            $table->string('account_name')->nullable();
            $table->string('account_number')->nullable();
            $table->time("open_time")->default("09:00");
            $table->time("close_time")->default("21:00");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('barbershops', function (Blueprint $table) {
            $table->dropColumn(['balance', 'bank_name', 'account_name', 'account_number']);
        });
    }
};
