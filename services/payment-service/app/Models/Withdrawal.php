<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Withdrawal extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'amount' => 'decimal:2',
        'webhook_payload' => 'array',
        'processed_at' => 'datetime',
    ];

    /**
     * Bank name to Xendit channel code mapping.
     */
    private static array $bankCodeMap = [
        'BCA' => 'ID_BCA',
        'MANDIRI' => 'ID_MANDIRI',
        'BNI' => 'ID_BNI',
        'BRI' => 'ID_BRI',
        'CIMB' => 'ID_CIMB',
        'OCBC' => 'ID_OCBC',
        'PERMATA' => 'ID_PERMATA',
        'DANAMON' => 'ID_DANAMON',
    ];

    public static function getBankCode(string $bankName): ?string
    {
        return self::$bankCodeMap[strtoupper($bankName)] ?? null;
    }
}
