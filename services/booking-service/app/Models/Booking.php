<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    public const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

    public const ACTIVE_STATUSES = ['pending', 'confirmed'];

    protected $guarded = ['id'];

    protected $casts = [
        'booking_date' => 'date',
        'booking_time' => 'datetime:H:i',
        'service_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'service_duration_minutes' => 'integer',
    ];

    /**
     * Store the calendar date without a time component so sqlite and MySQL
     * behave the same way.
     */
    protected function bookingDate(): Attribute
    {
        return Attribute::make(
            set: static function ($value): string {
                if ($value instanceof \DateTimeInterface) {
                    return $value->format('Y-m-d');
                }

                return substr((string) $value, 0, 10);
            },
        );
    }

    /**
     * Store the clock time only; the date lives in booking_date.
     */
    protected function bookingTime(): Attribute
    {
        return Attribute::make(
            set: static function ($value): string {
                if ($value instanceof \DateTimeInterface) {
                    return $value->format('H:i:s');
                }

                $value = (string) $value;

                return strlen($value) === 5 ? $value.':00' : $value;
            },
        );
    }

    public function startsAt(): Carbon
    {
        $date = $this->booking_date instanceof \DateTimeInterface
            ? $this->booking_date->format('Y-m-d')
            : substr((string) $this->booking_date, 0, 10);

        $time = $this->booking_time instanceof \DateTimeInterface
            ? $this->booking_time->format('H:i:s')
            : (string) $this->booking_time;

        if (strlen($time) === 5) {
            $time .= ':00';
        }

        return Carbon::parse($date.' '.$time, (string) config('app.timezone'));
    }

    public function endsAt(): Carbon
    {
        return $this->startsAt()->addMinutes((int) $this->service_duration_minutes);
    }

    public function overlaps(Carbon $start, Carbon $end): bool
    {
        return $start->lessThan($this->endsAt()) && $end->greaterThan($this->startsAt());
    }

    public function isOwnedBy(string $userId): bool
    {
        return (string) $this->user_id === $userId;
    }
}
