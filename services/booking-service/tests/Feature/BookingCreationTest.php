<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Support\Outbox\OutboxEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\CreatesBookings;
use Tests\Concerns\IssuesTokens;
use Tests\TestCase;

class BookingCreationTest extends TestCase
{
    use CreatesBookings, IssuesTokens, RefreshDatabase;

    protected function fakeCatalog(): void
    {
        Http::fake([
            'http://catalog-service/internal/catalog/validate-booking' => Http::response(
                $this->catalogValidationResponse(),
                200,
            ),
            '*' => Http::response([], 200),
        ]);
    }

    public function test_create_booking_stores_snapshots_and_publishes_the_outbox_event(): void
    {
        $this->fakeCatalog();

        $date = now()->addDays(2)->toDateString();

        $response = $this->postJson('/api/bookings', [
            'barbershop_id' => $this->shopId,
            'service_id' => $this->serviceId,
            'capster_id' => $this->capsterId,
            'booking_date' => $date,
            'booking_time' => '10:00',
        ], $this->authHeaders(['sub' => $this->customerId]));

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Booking created successfully')
            ->assertJsonPath('booking.barbershop.id', $this->shopId)
            ->assertJsonPath('booking.barbershop.name', 'Brody Barbershop')
            ->assertJsonPath('booking.barbershop.address', 'Jl. Merdeka 1')
            ->assertJsonPath('booking.service.name', 'Haircut')
            ->assertJsonPath('booking.capster.name', 'Andi')
            ->assertJsonPath('booking.status', 'pending');

        $booking = Booking::query()->firstOrFail();

        $this->assertSame($this->customerId, $booking->user_id);
        $this->assertSame('Budi', $booking->user_name);
        $this->assertSame($this->ownerId, $booking->barbershop_owner_id);
        $this->assertSame('Brody Barbershop', $booking->barbershop_name);
        $this->assertSame('Haircut', $booking->service_name);
        $this->assertSame('50000.00', $booking->service_price);
        $this->assertSame(30, (int) $booking->service_duration_minutes);
        $this->assertSame('Andi', $booking->capster_name);
        $this->assertSame($date, $booking->booking_date->format('Y-m-d'));
        $this->assertSame('10:00', $booking->booking_time->format('H:i'));
        $this->assertSame('50000.00', $booking->total_price);

        $event = OutboxEvent::query()->where('type', 'BookingCreated')->firstOrFail();

        $this->assertNull($event->relayed_at);
        $this->assertSame($booking->id, $event->payload['booking_id']);
        $this->assertSame($this->customerId, $event->payload['user_id']);
        $this->assertSame($this->ownerId, $event->payload['barbershop_owner_id']);
        $this->assertSame($date, $event->payload['booking_date']);
        $this->assertSame('10:00', $event->payload['booking_time']);
        $this->assertSame('Haircut', $event->payload['service_name']);
        $this->assertSame('Andi', $event->payload['capster_name']);
    }

    public function test_second_overlapping_booking_is_rejected_with_422(): void
    {
        $this->fakeCatalog();

        $date = now()->addDays(2)->toDateString();
        $headers = $this->authHeaders(['sub' => $this->customerId]);

        $this->postJson('/api/bookings', [
            'barbershop_id' => $this->shopId,
            'service_id' => $this->serviceId,
            'capster_id' => $this->capsterId,
            'booking_date' => $date,
            'booking_time' => '10:00',
        ], $headers)->assertStatus(201);

        $this->postJson('/api/bookings', [
            'barbershop_id' => $this->shopId,
            'service_id' => $this->serviceId,
            'capster_id' => $this->capsterId,
            'booking_date' => $date,
            'booking_time' => '10:15',
        ], $headers)->assertStatus(422);

        $this->assertSame(1, Booking::query()->count());
        $this->assertSame(1, OutboxEvent::query()->where('type', 'BookingCreated')->count());
    }

    public function test_booking_in_the_past_is_rejected(): void
    {
        Http::fake(['*' => Http::response([], 200)]);

        $this->postJson('/api/bookings', [
            'barbershop_id' => $this->shopId,
            'service_id' => $this->serviceId,
            'capster_id' => $this->capsterId,
            'booking_date' => now()->subDay()->toDateString(),
            'booking_time' => '10:00',
        ], $this->authHeaders(['sub' => $this->customerId]))->assertStatus(422);
    }

    public function test_catalog_rejection_returns_422(): void
    {
        Http::fake([
            'http://catalog-service/internal/catalog/validate-booking' => Http::response(['valid' => false], 200),
            '*' => Http::response([], 200),
        ]);

        $this->postJson('/api/bookings', [
            'barbershop_id' => $this->shopId,
            'service_id' => $this->serviceId,
            'capster_id' => $this->capsterId,
            'booking_date' => now()->addDays(2)->toDateString(),
            'booking_time' => '10:00',
        ], $this->authHeaders(['sub' => $this->customerId]))->assertStatus(422);
    }

    public function test_catalog_outage_returns_503(): void
    {
        Http::fake(['*' => Http::response([], 503)]);

        $this->postJson('/api/bookings', [
            'barbershop_id' => $this->shopId,
            'service_id' => $this->serviceId,
            'capster_id' => $this->capsterId,
            'booking_date' => now()->addDays(2)->toDateString(),
            'booking_time' => '10:00',
        ], $this->authHeaders(['sub' => $this->customerId]))->assertStatus(503);
    }
}
