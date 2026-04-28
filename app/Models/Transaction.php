<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class Transaction extends Model
{
    /** @use HasFactory<\Database\Factories\TransactionFactory> */
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = "string";

    protected $guarded = ['id'];

    public function newUniqueId(): string
    {
        return (string) Uuid::uuid7();
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class, 'barbershop_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    public function capster()
    {
        return $this->belongsTo(Capster::class, 'capster_id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, 'booking_id');
    }
}
