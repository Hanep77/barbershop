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
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }
}
