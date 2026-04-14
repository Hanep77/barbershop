<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

class Capster extends Model
{
    /** @use HasFactory<\Database\Factories\CapsterFactory> */
    use HasFactory, HasUuids;

    protected $guarded = ["id"];

    public function newUniqueId(): string
    {
        return (string) Uuid::uuid7();
    }
}
