<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;


class Service extends Model
{
    use HasUuids;
    protected $guarded = ["id"];

    public function newUniqueId(): string
    {
        return (string) Uuid::uuid7();
    }

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }

    public function category()
    {
        return $this->belongsTo(ServiceCategory::class, "category_id");
    }
}
