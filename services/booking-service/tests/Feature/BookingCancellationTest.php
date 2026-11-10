<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Support\Outbox\OutboxEvent;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\CreatesBookings;
use Tests\Concerns\IssuesTokens;
use Tests\TestCase;

class BookingCancellationTest extends TestCase
{
    use CreatesBookings, IssuesTokens, RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function fakePayment(string $status = 'success', float $amount = 50000): void
    {
        Http::fake([
            'http://payment-service/internal/payments/by-booking/*' => Http::response([
                'id' => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                'booking_id' => 1,
                'amount' => $amount,
                'status' => $status,
            ], 200),
            'http://payment-service/internal/payments/refund' => Http::response([
                'refund_status' => 'pending',
                'refund_amount' => $amount,
            ], 200),
            '*' => Http::response([], 200),
        ]);
    }

    private function makeCancellable(string $time = '12:00'): Booking
    {
        return $this->makeBooking([
            'booking_date' => '2026-11-10',
            'booking_time' => $time,
            'status' => 'confirmed',
        ]);
    }

    public function test_customer_cancelling_more_than_two_hours_ahead_gets_full_refund(): void
    {
        Carbon::setTestNow('2026-11-10 08:00:00');
        $this->fakePayment();

        $booking = $this->makeCancellable('12:00');

        $response = $this->postJson(
            '/api/bookings/'.$booking->id.'/cancel',
            ['cancellation_reason' => 'changed plans'],
            $this->authHeaders(['sub' => $this->customerId]),
        );

        $response->assertStatus(200)
            ->assertJsonPath('refund_amount', 50000)
            ->assertJsonPath('refund_status', 'pending')
            ->assertJsonPath('booking.status', 'cancelled');

        $booking->refresh();

        $this->assertSame('cancelled', $booking->status);
        $this->assertSame('50000.00', $booking->refund_amount);
        $this->assertSame('pending', $booking->refund_status);
        $this->assertSame('cancelled by customer', $booking->cancellation_reason);
        $this->assertSame('customer', $booking->cancelled_by);

        Http::assertSent(fn ($request) => str_contains($request->url(), '/internal/payments/refund')
            && $request['booking_id'] === $booking->id
            && (float) $request['amount'] === 50000.0);

        $this->assertSame(1, OutboxEvent::query()->where('type', 'BookingCancelled')->count());
        $this->assertSame(1, OutboxEvent::query()->where('type', 'BookingStatusChanged')->count());

        $event = OutboxEvent::query()->where('type', 'BookingCancelled')->firstOrFail();
        $this->assertSame('customer', $event->payload['cancelled_by']);
        $this->assertSame(50000.0, (float) $event->payload['refund_amount']);
    }

    public function test_cancelling_within_two_hours_gets_no_refund(): void
    {
        Carbon::setTestNow('2026-11-10 11:00:00');
        $this->fakePayment();

        $booking = $this->makeCancellable('12:00');

        $response = $this->postJson(
            '/api/bookings/'.$booking->id.'/cancel',
            [],
            $this->authHeaders(['sub' => $this->customerId]),
        );

        $response->assertStatus(200)
            ->assertJsonPath('refund_amount', 0)
            ->assertJsonPath('refund_status', 'none');

        Http::assertNotSent(fn ($request) => str_contains($request->url(), '/internal/payments/refund'));
    }

    public function test_refund_is_not_issued_when_payment_was_not_successful(): void
    {
        Carbon::setTestNow('2026-11-10 08:00:00');
        $this->fakePayment('pending');

        $booking = $this->makeCancellable('12:00');

        $this->postJson(
            '/api/bookings/'.$booking->id.'/cancel',
            [],
            $this->authHeaders(['sub' => $this->customerId]),
        )->assertStatus(200)->assertJsonPath('refund_amount', 0);

        Http::assertNotSent(fn ($request) => str_contains($request->url(), '/internal/payments/refund'));
    }

    public function test_payment_refund_failure_marks_refund_status_failed(): void
    {
        Carbon::setTestNow('2026-11-10 08:00:00');

        Http::fake([
            'http://payment-service/internal/payments/by-booking/*' => Http::response([
                'booking_id' => 1,
                'amount' => 50000,
                'status' => 'success',
            ], 200),
            'http://payment-service/internal/payments/refund' => Http::response([], 500),
            '*' => Http::response([], 200),
        ]);

        $booking = $this->makeCancellable('12:00');

        $this->postJson(
            '/api/bookings/'.$booking->id.'/cancel',
            [],
            $this->authHeaders(['sub' => $this->customerId]),
        )->assertStatus(200)->assertJsonPath('refund_status', 'failed');

        $this->assertSame('failed', $booking->refresh()->refund_status);
    }

    public function test_a_customer_cannot_cancel_someone_elses_booking(): void
    {
        Carbon::setTestNow('2026-11-10 08:00:00');
        Http::fake(['*' => Http::response([], 200)]);

        $booking = $this->makeCancellable('12:00');

        $this->postJson(
            '/api/bookings/'.$booking->id.'/cancel',
            [],
            $this->authHeaders(['sub' => '99999999-9999-4999-8999-999999999999']),
        )->assertStatus(403);
    }

    public function test_completed_bookings_cannot_be_cancelled(): void
    {
        Carbon::setTestNow('2026-11-10 08:00:00');
        Http::fake(['*' => Http::response([], 200)]);

        $booking = $this->makeBooking([
            'booking_date' => '2026-11-10',
            'booking_time' => '09:00',
            'status' => 'completed',
        ]);

        $this->postJson(
            '/api/bookings/'.$booking->id.'/cancel',
            [],
            $this->authHeaders(['sub' => $this->customerId]),
        )->assertStatus(400);
    }

    public function test_cancellation_events_remain_in_the_outbox_for_the_relay(): void
    {
        Carbon::setTestNow('2026-11-10 11:00:00');
        $this->fakePayment();

        $booking = $this->makeCancellable('12:00');

        $this->postJson(
            '/api/bookings/'.$booking->id.'/cancel',
            [],
            $this->authHeaders(['sub' => $this->customerId]),
        )->assertStatus(200);

        $events = OutboxEvent::query()->get();

        $this->assertCount(2, $events);
        $this->assertTrue($events->every(fn (OutboxEvent $event) => $event->relayed_at === null));
    }
}
