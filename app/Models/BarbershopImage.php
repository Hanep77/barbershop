<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class BarbershopImage extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = ['id'];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function newUniqueId(): string
    {
        return (string) Uuid::uuid7();
    }

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }
}
