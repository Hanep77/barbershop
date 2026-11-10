<?php

namespace Tests\Unit;

use App\Services\BookingService;
use App\Support\Outbox\OutboxEvent;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesBookings;
use Tests\TestCase;

class BookingTransitionTest extends TestCase
{
    use CreatesBookings, RefreshDatabase;

    private function service(): BookingService
    {
        return $this->app->make(BookingService::class);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_payment_succeeded_confirms_only_pending_bookings_and_is_idempotent(): void
    {
        $booking = $this->makeBooking(['status' => 'pending']);

        $service = $this->service();

        $this->assertTrue($service->applyPaymentSucceeded(['booking_id' => $booking->id]));
        $this->assertSame('confirmed', $booking->refresh()->status);

        // Replayed event: still confirmed, not double-transitioned.
        $this->assertFalse($service->applyPaymentSucceeded(['booking_id' => $booking->id]));
        $this->assertSame('confirmed', $booking->refresh()->status);

        $completed = $this->makeBooking(['status' => 'completed']);
        $this->assertFalse($service->applyPaymentSucceeded(['booking_id' => $completed->id]));
        $this->assertSame('completed', $completed->refresh()->status);
    }

    public function test_payment_failed_cancels_only_pending_bookings(): void
    {
        $pending = $this->makeBooking(['status' => 'pending']);
        $confirmed = $this->makeBooking(['status' => 'confirmed']);

        $service = $this->service();

        $this->assertTrue($service->applyPaymentFailed(['booking_id' => $pending->id]));

        $pending->refresh();
        $this->assertSame('cancelled', $pending->status);
        $this->assertSame('payment failed', $pending->cancellation_reason);
        $this->assertSame('system', $pending->cancelled_by);

        $this->assertFalse($service->applyPaymentFailed(['booking_id' => $confirmed->id]));
        $this->assertSame('confirmed', $confirmed->refresh()->status);
    }

    public function test_refund_events_update_refund_status(): void
    {
        $booking = $this->makeBooking(['status' => 'cancelled', 'refund_status' => 'pending']);

        $service = $this->service();

        $this->assertTrue($service->applyRefundSucceeded(['booking_id' => $booking->id]));
        $this->assertSame('success', $booking->refresh()->refund_status);

        $this->assertTrue($service->applyRefundFailed(['booking_id' => $booking->id]));
        $this->assertSame('failed', $booking->refresh()->refund_status);

        $this->assertFalse($service->applyRefundSucceeded(['booking_id' => 999999]));
    }

    public function test_auto_revalidate_cancels_no_shows_without_refund(): void
    {
        Carbon::setTestNow('2026-11-10 10:20:00');

        $noShow = $this->makeBooking([
            'booking_date' => '2026-11-10',
            'booking_time' => '10:00',
            'status' => 'confirmed',
        ]);

        $stillWaiting = $this->makeBooking([
            'booking_date' => '2026-11-10',
            'booking_time' => '10:10',
            'status' => 'confirmed',
        ]);

        // Just inside the 15 minute tolerance window.
        $withinGrace = $this->makeBooking([
            'booking_date' => '2026-11-10',
            'booking_time' => '10:06',
            'status' => 'confirmed',
        ]);

        $processed = $this->service()->autoRevalidate();

        $this->assertSame(1, $processed);
        $this->assertSame('cancelled', $noShow->refresh()->status);
        $this->assertSame('confirmed', $stillWaiting->refresh()->status);
        $this->assertSame('confirmed', $withinGrace->refresh()->status);

        $noShow->refresh();
        $this->assertSame('system', $noShow->cancelled_by);
        $this->assertSame('0.00', $noShow->refund_amount);
        $this->assertSame('none', $noShow->refund_status);
        $this->assertSame(
            'No-show: Customer did not arrive within 15-minute tolerance',
            $noShow->cancellation_reason,
        );

        $this->assertSame(1, OutboxEvent::query()->where('type', 'BookingCancelled')->count());
        $this->assertSame(1, OutboxEvent::query()->where('type', 'BookingStatusChanged')->count());

        $this->assertSame(0, $this->service()->autoRevalidate());
    }
}
