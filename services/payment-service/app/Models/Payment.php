<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected $casts = [
        'booking_id' => 'integer',
        'amount' => 'decimal:2',
        'refund_amount' => 'decimal:2',
    ];

    public $incrementing = false;

    protected $keyType = 'string';
}
