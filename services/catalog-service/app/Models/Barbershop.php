<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Barbershop extends Model
{
    use HasUuids, SoftDeletes;

    public const FALLBACK_COVER_IMAGE = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = ['id'];

    protected $casts = [
        'rating' => 'float',
        'is_active' => 'boolean',
        'ratings_avg_rating' => 'float',
        'services_min_price' => 'float',
        'ratings_count' => 'integer',
        'capsters_count' => 'integer',
    ];

    protected $appends = ['coverImage'];

    public function newUniqueId(): string
    {
        return (string) Str::uuid7();
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function capsters(): HasMany
    {
        return $this->hasMany(Capster::class);
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(BarbershopImage::class);
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(BarbershopImage::class)->where('is_primary', true);
    }

    protected function getCoverImageAttribute(): string
    {
        return $this->attributes['cover_image'] ?? self::FALLBACK_COVER_IMAGE;
    }

    protected function openTime(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value === null ? null : substr($value, 0, 5),
        );
    }

    protected function closeTime(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value === null ? null : substr($value, 0, 5),
        );
    }

    /**
     * Summary shape shared by the internal API.
     */
    public function toInternalSummary(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'address' => $this->address,
            'phone_number' => $this->phone_number,
            'open_time' => $this->open_time,
            'close_time' => $this->close_time,
            'is_active' => (bool) $this->is_active,
        ];
    }
}
