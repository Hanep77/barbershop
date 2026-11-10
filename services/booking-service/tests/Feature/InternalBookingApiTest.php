<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesBookings;
use Tests\TestCase;

class InternalBookingApiTest extends TestCase
{
    use CreatesBookings, RefreshDatabase;

    private function internalHeaders(): array
    {
        return ['X-Internal-Token' => (string) config('services.internal.token')];
    }

    public function test_internal_show_returns_the_booking_with_snapshots(): void
    {
        $booking = $this->makeBooking();

        $this->getJson('/internal/bookings/'.$booking->id, $this->internalHeaders())
            ->assertStatus(200)
            ->assertJsonPath('id', $booking->id)
            ->assertJsonPath('barbershop_owner_id', $this->ownerId)
            ->assertJsonPath('service.name', 'Haircut')
            ->assertJsonPath('capster.name', 'Andi');
    }

    public function test_validate_review_requires_owner_and_completed_status(): void
    {
        $completed = $this->makeBooking(['status' => 'completed']);
        $pending = $this->makeBooking(['status' => 'pending']);

        $this->postJson(
            '/internal/bookings/'.$completed->id.'/validate-review',
            ['user_id' => $this->customerId],
            $this->internalHeaders(),
        )->assertStatus(200)
            ->assertJsonPath('valid', true)
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('capster_id', $this->capsterId)
            ->assertJsonPath('barbershop_id', $this->shopId);

        $this->postJson(
            '/internal/bookings/'.$completed->id.'/validate-review',
            ['user_id' => '99999999-9999-4999-8999-999999999999'],
            $this->internalHeaders(),
        )->assertJsonPath('valid', false);

        $this->postJson(
            '/internal/bookings/'.$pending->id.'/validate-review',
            ['user_id' => $this->customerId],
            $this->internalHeaders(),
        )->assertJsonPath('valid', false);
    }

    public function test_internal_stats_today_and_recent_rows(): void
    {
        $this->makeBooking([
            'booking_date' => now()->toDateString(),
            'booking_time' => '10:00',
        ]);

        $this->getJson('/internal/bookings/by-barbershop/'.$this->shopId.'/stats', $this->internalHeaders())
            ->assertStatus(200)
            ->assertJsonPath('total_bookings', 1)
            ->assertJsonPath('current_month', 1)
            ->assertJsonPath('last_month', 0);

        $this->getJson('/internal/bookings/by-barbershop/'.$this->shopId.'/today', $this->internalHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.0.customer_name', 'Budi')
            ->assertJsonPath('data.0.booking_time', '10:00');

        $this->getJson('/internal/bookings/by-barbershop/'.$this->shopId.'/recent?limit=5', $this->internalHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.0.total_price', 50000);
    }
}
