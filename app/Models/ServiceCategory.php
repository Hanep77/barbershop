<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class ServiceCategory extends Model
{
    /** @use HasFactory<\Database\Factories\ServiceCategoryFactory> */
    use HasFactory, HasUuids;

    protected $guarded = ["id"];


    public function newUniqueId(): string
    {
        return (string) Uuid::uuid7();
    }


    public function services()
    {
        return $this->hasMany(Service::class, "category_id");
    }

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }
}
