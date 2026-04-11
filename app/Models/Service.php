<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $guarded = ["id"];

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }

    public function category()
    {
        return $this->belongsTo(ServiceCategory::class, "category_id");
    }
}
