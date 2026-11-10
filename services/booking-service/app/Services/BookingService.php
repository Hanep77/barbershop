<?php

namespace App\Services;

use App\Models\Booking;
use App\Support\Integrations\CatalogGateway;
use App\Support\Integrations\PaymentGateway;
use App\Support\Outbox\EventPublisher;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * All booking state transitions live here so the HTTP controllers and the
 * event consumer stay thin and share the same rules.
 */
class BookingService
{
    public function __construct(
        private readonly CatalogGateway $catalog,
        private readonly PaymentGateway $payments,
    ) {
    }

    /**
     * @param array<string, mixed> $attributes
     *
     * @throws BookingConflictException
     */
    public function create(array $attributes): Booking
    {
        $capsterId = (string) $attributes['capster_id'];
        $date = substr((string) $attributes['booking_date'], 0, 10);

        return DB::transaction(function () use ($attributes, $capsterId, $date): Booking {
            $locked = $this->acquireCapsterLock($capsterId, $date);

            try {
                $start = $this->combine($date, (string) $attributes['booking_time']);
                $end = $start->copy()->addMinutes((int) $attributes['service_duration_minutes']);

                if ($this->hasConflict($capsterId, $date, $start, $end)) {
                    throw new BookingConflictException('This time slot is already booked.');
                }

                $booking = Booking::query()->create($attributes);

                $this->publishCreated($booking);

                return $booking;
            } finally {
                if ($locked) {
                    $this->releaseCapsterLock($capsterId, $date);
                }
            }
        });
    }

    /**
     * Cancel a pending/confirmed booking and (optionally) request a refund.
     *
     * @return array{booking: Booking, refund_amount: float, refund_status: string}
     */
    public function cancel(Booking $booking, string $by): array
    {
        $payment = $this->payments->byBooking($booking->id);
        $paid = is_array($payment) && ($payment['status'] ?? null) === 'success';
        $amount = (float) ($payment['amount'] ?? $booking->total_price ?? 0);

        $refund = 0.0;

        if ($paid) {
            if ($by === 'barbershop') {
                // The shop cancelled: the customer always gets everything back.
                $refund = $amount;
            } elseif ($this->hoursUntil($booking) >= 2) {
                $refund = $amount;
            }
        }

        $reason = $by === 'barbershop' ? 'cancelled by barbershop' : 'cancelled by customer';

        DB::transaction(function () use ($booking, $by, $refund, $reason): void {
            $booking->forceFill([
                'status' => 'cancelled',
                'refund_amount' => $refund,
                'refund_status' => $refund > 0 ? 'pending' : 'none',
                'cancellation_reason' => $reason,
                'cancelled_by' => $by,
            ])->save();

            $fresh = $booking->fresh();

            $this->publishCancelled($fresh, $by, $refund);
            $this->publishStatusChanged($fresh, 'cancelled');
        });

        if ($refund > 0) {
            try {
                $this->payments->refund($booking->id, $refund, $reason);
                $booking->forceFill(['refund_status' => 'pending'])->save();
            } catch (Throwable) {
                $booking->forceFill(['refund_status' => 'failed'])->save();
            }
        }

        $booking->refresh();

        return [
            'booking' => $booking,
            'refund_amount' => $refund,
            'refund_status' => (string) $booking->refund_status,
        ];
    }

    public function updateStatus(Booking $booking, string $status): Booking
    {
        DB::transaction(function () use ($booking, $status): void {
            $booking->forceFill(['status' => $status])->save();

            $this->publishStatusChanged($booking->fresh(), $status);
        });

        return $booking->refresh();
    }

    /**
     * PaymentSucceeded consumer handler: pending -> confirmed only.
     */
    public function applyPaymentSucceeded(array $payload): bool
    {
        $booking = $this->bookingFromEvent($payload);

        if ($booking === null || $booking->status !== 'pending') {
            return false;
        }

        $booking->forceFill(['status' => 'confirmed'])->save();

        return true;
    }

    /**
     * PaymentFailed consumer handler: pending -> cancelled.
     */
    public function applyPaymentFailed(array $payload): bool
    {
        $booking = $this->bookingFromEvent($payload);

        if ($booking === null || $booking->status !== 'pending') {
            return false;
        }

        $booking->forceFill([
            'status' => 'cancelled',
            'cancellation_reason' => 'payment failed',
            'cancelled_by' => 'system',
            'refund_amount' => 0,
            'refund_status' => 'none',
        ])->save();

        return true;
    }

    public function applyRefundSucceeded(array $payload): bool
    {
        return $this->applyRefundResult($payload, 'success');
    }

    public function applyRefundFailed(array $payload): bool
    {
        return $this->applyRefundResult($payload, 'failed');
    }

    /**
     * Cancel confirmed bookings whose start plus the 15 minute tolerance has
     * already passed. Never refunds a no-show.
     */
    public function autoRevalidate(): int
    {
        $processed = 0;

        Booking::query()
            ->where('status', 'confirmed')
            ->whereDate('booking_date', '<=', now()->toDateString())
            ->get()
            ->each(function (Booking $booking) use (&$processed): void {
                if (now()->lessThanOrEqualTo($booking->startsAt()->copy()->addMinutes(15))) {
                    return;
                }

                DB::transaction(function () use ($booking): void {
                    $booking->forceFill([
                        'status' => 'cancelled',
                        'cancellation_reason' => 'No-show: Customer did not arrive within 15-minute tolerance',
                        'cancelled_by' => 'system',
                        'refund_amount' => 0,
                        'refund_status' => 'none',
                    ])->save();

                    $fresh = $booking->fresh();

                    $this->publishCancelled($fresh, 'system', 0.0);
                    $this->publishStatusChanged($fresh, 'cancelled');
                });

                $processed++;
            });

        return $processed;
    }

    private function applyRefundResult(array $payload, string $status): bool
    {
        $booking = $this->bookingFromEvent($payload);

        if ($booking === null) {
            return false;
        }

        $booking->forceFill(['refund_status' => $status])->save();

        return true;
    }

    private function bookingFromEvent(array $payload): ?Booking
    {
        $id = $payload['booking_id'] ?? null;

        if ($id === null || $id === '') {
            return null;
        }

        return Booking::query()->find($id);
    }

    private function hasConflict(string $capsterId, string $date, Carbon $start, Carbon $end): bool
    {
        $existing = Booking::query()
            ->where('capster_id', $capsterId)
            ->whereDate('booking_date', $date)
            ->whereIn('status', Booking::ACTIVE_STATUSES)
            ->get();

        foreach ($existing as $booking) {
            if ($booking->overlaps($start, $end)) {
                return true;
            }
        }

        return false;
    }

    /**
     * MySQL advisory lock keyed by capster + day. sqlite (tests) has no
     * GET_LOCK, so the overlap query alone serialises the request.
     */
    private function acquireCapsterLock(string $capsterId, string $date): bool
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return false;
        }

        try {
            $row = DB::selectOne('SELECT GET_LOCK(?, 5) AS acquired', [$this->lockName($capsterId, $date)]);

            return (int) ($row->acquired ?? 0) === 1;
        } catch (Throwable) {
            return false;
        }
    }

    private function releaseCapsterLock(string $capsterId, string $date): void
    {
        try {
            DB::selectOne('SELECT RELEASE_LOCK(?) AS released', [$this->lockName($capsterId, $date)]);
        } catch (Throwable) {
            // Lock is released automatically when the connection closes.
        }
    }

    private function lockName(string $capsterId, string $date): string
    {
        return substr("capster:{$capsterId}:{$date}", 0, 64);
    }

    private function hoursUntil(Booking $booking): float
    {
        return (float) now()->diffInHours($booking->startsAt(), false);
    }

    private function combine(string $date, string $time): Carbon
    {
        $time = strlen($time) === 5 ? $time.':00' : $time;

        return Carbon::parse($date.' '.$time, (string) config('app.timezone'));
    }

    private function publishCreated(Booking $booking): void
    {
        EventPublisher::publish('BookingCreated', [
            'booking_id' => (int) $booking->id,
            'user_id' => $booking->user_id,
            'user_name' => $booking->user_name,
            'barbershop_id' => $booking->barbershop_id,
            'barbershop_owner_id' => $booking->barbershop_owner_id,
            'barbershop_name' => $booking->barbershop_name,
            'service_name' => $booking->service_name,
            'capster_name' => $booking->capster_name,
            'booking_date' => $booking->booking_date->format('Y-m-d'),
            'booking_time' => $booking->booking_time->format('H:i'),
        ]);
    }

    private function publishCancelled(Booking $booking, string $by, float $refund): void
    {
        EventPublisher::publish('BookingCancelled', [
            'booking_id' => (int) $booking->id,
            'user_id' => $booking->user_id,
            'user_name' => $booking->user_name,
            'barbershop_id' => $booking->barbershop_id,
            'barbershop_owner_id' => $booking->barbershop_owner_id,
            'barbershop_name' => $booking->barbershop_name,
            'booking_date' => $booking->booking_date->format('Y-m-d'),
            'booking_time' => $booking->booking_time->format('H:i'),
            'cancelled_by' => $by,
            'refund_amount' => $refund,
        ]);
    }

    private function publishStatusChanged(Booking $booking, string $status): void
    {
        EventPublisher::publish('BookingStatusChanged', [
            'booking_id' => (int) $booking->id,
            'user_id' => $booking->user_id,
            'barbershop_owner_id' => $booking->barbershop_owner_id,
            'barbershop_name' => $booking->barbershop_name,
            'service_name' => $booking->service_name,
            'status' => $status,
        ]);
    }
}
