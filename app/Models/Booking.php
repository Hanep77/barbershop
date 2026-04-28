<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'booking_date' => 'date',
        'booking_time' => 'datetime:H:i',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }

    public function capster()
    {
        return $this->belongsTo(Capster::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}
