<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->string('external_id')->nullable()->unique()->after('account_name');
            $table->string('xendit_disbursement_id')->nullable()->after('external_id');
            $table->string('xendit_status')->nullable()->after('status');
            $table->string('failure_code')->nullable()->after('xendit_status');
            $table->text('failure_reason')->nullable()->after('failure_code');
            $table->timestamp('processed_at')->nullable()->after('failure_reason');
            $table->json('webhook_payload')->nullable()->after('processed_at');
        });
    }

    public function down(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropUnique(['external_id']);
            $table->dropColumn([
                'external_id',
                'xendit_disbursement_id',
                'xendit_status',
                'failure_code',
                'failure_reason',
                'processed_at',
                'webhook_payload',
            ]);
        });
    }
};
