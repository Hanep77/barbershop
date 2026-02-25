<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    /** @use HasFactory<\Database\Factories\TransactionFactory> */
    use HasFactory;


    protected $guarded = ['id'];

    public function customer()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class, 'barbershop_id');
    }
}
