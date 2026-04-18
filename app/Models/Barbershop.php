<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class Barbershop extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = ['id'];

    protected $appends = ["coverImage"];

    public function getCoverImageAttribute()
    {
        return $this->attributes["cover_image"] ?? "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop";
    }

    public function newUniqueId(): string
    {
        return (string) Uuid::uuid7();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function capsters()
    {
        return $this->hasMany(Capster::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
