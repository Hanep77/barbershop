<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class Payment extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = "string";

    protected $guarded = ['id'];

    public function newUniqueId(): string
    {
        return (string) Uuid::uuid7();
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
