<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarbershopBalance extends Model
{
    protected $primaryKey = 'barbershop_id';

    protected $guarded = [];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public $incrementing = false;

    protected $keyType = 'string';
}
