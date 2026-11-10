<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rating extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'rating' => 'integer',
    ];

    protected $appends = ['user'];

    public function barbershop(): BelongsTo
    {
        return $this->belongsTo(Barbershop::class);
    }

    public function capster(): BelongsTo
    {
        return $this->belongsTo(Capster::class);
    }

    /**
     * Identity never exposes its database to this service, so ratings keep
     * a denormalized author snapshot taken from the JWT at write time.
     */
    protected function user(): Attribute
    {
        return Attribute::make(
            get: fn () => [
                'id' => $this->user_id,
                'name' => $this->user_name,
                'avatar' => $this->user_avatar,
            ],
        );
    }
}
