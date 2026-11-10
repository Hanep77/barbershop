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

class PartnerBookingTest extends TestCase
{
    use CreatesBookings, IssuesTokens, RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function fakeCatalog(): void
    {
        Http::fake([
            'http://catalog-service/internal/barbershops/by-owner/*' => Http::response([
                'id' => $this->shopId,
                'user_id' => $this->ownerId,
                'name' => 'Brody Barbershop',
                'address' => 'Jl. Merdeka 1',
            ], 200),
            '*' => Http::response([], 200),
        ]);
    }

    private function ownerHeaders(): array
    {
        return $this->authHeaders(['sub' => $this->ownerId, 'role' => 'barbershop']);
    }

    public function test_partner_index_returns_snapshot_rows(): void
    {
        $this->fakeCatalog();
        $booking = $this->makeBooking();

        $this->getJson('/api/partner/barbershop/bookings', $this->ownerHeaders())
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $booking->id)
            ->assertJsonPath('data.0.user.name', 'Budi')
            ->assertJsonPath('data.0.service.name', 'Haircut')
            ->assertJsonPath('data.0.capster.name', 'Andi');
    }

    public function test_partner_index_returns_404_without_a_shop(): void
    {
        Http::fake(['*' => Http::response([], 404)]);

        $this->getJson('/api/partner/barbershop/bookings', $this->ownerHeaders())
            ->assertStatus(404);
    }

    public function test_owner_can_update_status_and_an_event_is_published(): void
    {
        $this->fakeCatalog();
        $booking = $this->makeBooking();

        $this->putJson(
            '/api/partner/barbershop/bookings/'.$booking->id.'/status',
            ['status' => 'completed'],
            $this->ownerHeaders(),
        )->assertStatus(200)->assertJsonPath('booking.status', 'completed');

        $this->assertSame('completed', $booking->refresh()->status);

        $event = OutboxEvent::query()->where('type', 'BookingStatusChanged')->firstOrFail();

        $this->assertSame('completed', $event->payload['status']);
        $this->assertSame($booking->id, $event->payload['booking_id']);
        $this->assertSame($this->customerId, $event->payload['user_id']);
        $this->assertSame($this->ownerId, $event->payload['barbershop_owner_id']);
        $this->assertSame('Haircut', $event->payload['service_name']);
        $this->assertSame('Brody Barbershop', $event->payload['barbershop_name']);
    }

    public function test_another_owner_cannot_update_the_status(): void
    {
        Http::fake([
            'http://catalog-service/internal/barbershops/by-owner/*' => Http::response([
                'id' => '66666666-6666-4666-8666-666666666666',
                'user_id' => '77777777-7777-4777-8777-777777777777',
                'name' => 'Another Shop',
            ], 200),
            '*' => Http::response([], 200),
        ]);

        $booking = $this->makeBooking();

        $this->putJson(
            '/api/partner/barbershop/bookings/'.$booking->id.'/status',
            ['status' => 'completed'],
            $this->ownerHeaders(),
        )->assertStatus(403);

        $this->assertSame('pending', $booking->refresh()->status);
        $this->assertSame(0, OutboxEvent::query()->count());
    }

    public function test_invalid_status_is_rejected(): void
    {
        $this->fakeCatalog();
        $booking = $this->makeBooking();

        $this->putJson(
            '/api/partner/barbershop/bookings/'.$booking->id.'/status',
            ['status' => 'no-show'],
            $this->ownerHeaders(),
        )->assertStatus(422);
    }

    public function test_barbershop_cancellation_refunds_even_inside_two_hours(): void
    {
        Carbon::setTestNow('2026-11-10 11:00:00');

        Http::fake([
            'http://catalog-service/internal/barbershops/by-owner/*' => Http::response([
                'id' => $this->shopId,
                'user_id' => $this->ownerId,
                'name' => 'Brody Barbershop',
            ], 200),
            'http://payment-service/internal/payments/by-booking/*' => Http::response([
                'booking_id' => 1,
                'amount' => 50000,
                'status' => 'success',
            ], 200),
            'http://payment-service/internal/payments/refund' => Http::response([
                'refund_status' => 'pending',
                'refund_amount' => 50000,
            ], 200),
            '*' => Http::response([], 200),
        ]);

        $booking = $this->makeBooking([
            'booking_date' => '2026-11-10',
            'booking_time' => '12:00',
            'status' => 'confirmed',
        ]);

        $this->postJson(
            '/api/partner/barbershop/bookings/'.$booking->id.'/cancel',
            [],
            $this->ownerHeaders(),
        )->assertStatus(200)
            ->assertJsonPath('refund_amount', 50000)
            ->assertJsonPath('booking_status', 'cancelled');

        $booking->refresh();

        $this->assertSame('cancelled', $booking->status);
        $this->assertSame('cancelled by barbershop', $booking->cancellation_reason);
        $this->assertSame('barbershop', $booking->cancelled_by);
    }

    public function test_dashboard_stats_compose_local_catalog_and_payment_data(): void
    {
        Carbon::setTestNow('2026-11-10 09:00:00');

        Http::fake([
            'http://catalog-service/internal/barbershops/by-owner/*' => Http::response([
                'id' => $this->shopId,
                'user_id' => $this->ownerId,
                'name' => 'Brody Barbershop',
            ], 200),
            'http://catalog-service/internal/barbershops/*/stats' => Http::response([
                'active_capsters' => 3,
                'average_rating' => 4.7,
                'rating_change' => 0.2,
            ], 200),
            'http://payment-service/internal/payments/stats/*' => Http::response([
                'revenue' => 250000,
                'revenue_change' => 12.5,
            ], 200),
            '*' => Http::response([], 200),
        ]);

        $this->makeBooking(['booking_date' => '2026-11-10', 'booking_time' => '10:00']);
        $this->makeBooking(['booking_date' => '2026-11-12', 'booking_time' => '13:00']);
        $lastMonth = $this->makeBooking(['booking_date' => '2026-10-10', 'booking_time' => '10:00']);
        Booking::query()->whereKey($lastMonth->id)->update([
            'created_at' => now()->subMonthNoOverflow()->startOfMonth()->addDay(),
        ]);

        $this->getJson('/api/partner/barbershop/dashboard/stats', $this->ownerHeaders())
            ->assertStatus(200)
            ->assertJsonPath('total_bookings', 3)
            ->assertJsonPath('today_bookings_count', 1)
            ->assertJsonPath('revenue_this_month', 250000)
            ->assertJsonPath('active_capsters', 3)
            ->assertJsonPath('average_rating', 4.7)
            ->assertJsonPath('rating_change', 0.2)
            ->assertJsonPath('revenue_change', 12.5)
            ->assertJsonPath('bookings_change', 100);
    }

    public function test_dashboard_stats_degrade_when_catalog_and_payment_are_down(): void
    {
        Http::fake([
            'http://catalog-service/internal/barbershops/by-owner/*' => Http::response([
                'id' => $this->shopId,
                'user_id' => $this->ownerId,
                'name' => 'Brody Barbershop',
            ], 200),
            '*' => Http::response([], 503),
        ]);

        $this->makeBooking();

        $this->getJson('/api/partner/barbershop/dashboard/stats', $this->ownerHeaders())
            ->assertStatus(200)
            ->assertJsonPath('revenue_this_month', 0)
            ->assertJsonPath('active_capsters', 0)
            ->assertJsonPath('average_rating', 0);
    }

    public function test_dashboard_lists_today_and_recent_bookings(): void
    {
        Carbon::setTestNow('2026-11-10 09:00:00');
        $this->fakeCatalog();

        $this->makeBooking(['booking_date' => '2026-11-10', 'booking_time' => '10:00']);

        $this->getJson('/api/partner/barbershop/dashboard/today-appointments', $this->ownerHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.0.customer_name', 'Budi')
            ->assertJsonPath('data.0.service_name', 'Haircut')
            ->assertJsonPath('data.0.capster_name', 'Andi')
            ->assertJsonPath('data.0.booking_time', '10:00');

        $this->getJson('/api/partner/barbershop/dashboard/recent-bookings', $this->ownerHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.0.booking_date', '2026-11-10')
            ->assertJsonPath('data.0.total_price', 50000);
    }
}
