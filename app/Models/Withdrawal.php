<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Withdrawal extends Model
{
    /** @use HasFactory<\Database\Factories\WithdrawalFactory> */
    use HasFactory;

    protected $fillable = [
        'barbershop_id',
        'amount',
        'status',
        'bank_name',
        'account_number',
        'account_name',
        'external_id',
        'xendit_disbursement_id',
        'xendit_status',
        'failure_code',
        'failure_reason',
        'processed_at',
        'webhook_payload',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'webhook_payload' => 'json',
        'processed_at' => 'datetime',
    ];

    // Bank name to Xendit bank code mapping
    private static $bankCodeMap = [
        'BCA' => 'BCA',
        'MANDIRI' => 'MANDIRI',
        'BNI' => 'BNI',
        'BRI' => 'BRI',
        'CIMB' => 'CIMB',
        'OCBC' => 'OCBC',
        'PERMATA' => 'PERMATA',
        'DANAMON' => 'DANAMON',
    ];

    public static function getBankCode(string $bankName): ?string
    {
        return self::$bankCodeMap[strtoupper($bankName)] ?? null;
    }

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }
}
