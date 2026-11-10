<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\CreatesBookings;
use Tests\Concerns\IssuesTokens;
use Tests\TestCase;

class BookingEnrichmentTest extends TestCase
{
    use CreatesBookings, IssuesTokens, RefreshDatabase;

    public function test_index_enriches_bookings_with_payment_and_rating(): void
    {
        $booking = $this->makeBooking();

        Http::fake([
            'http://payment-service/internal/payments/by-bookings' => Http::response([
                'payments' => [
                    (string) $booking->id => [
                        'id' => 'pay-1',
                        'booking_id' => $booking->id,
                        'amount' => 50000,
                        'status' => 'success',
                    ],
                ],
            ], 200),
            'http://catalog-service/internal/ratings/by-bookings' => Http::response([
                'ratings' => [
                    (string) $booking->id => [
                        'id' => 7,
                        'booking_id' => $booking->id,
                        'rating' => 5,
                        'comment' => 'Great',
                    ],
                ],
            ], 200),
            'http://catalog-service/internal/barbershops/batch' => Http::response([
                'barbershops' => [
                    $this->shopId => ['id' => $this->shopId, 'address' => 'Jl. Merdeka 1'],
                ],
            ], 200),
            '*' => Http::response([], 200),
        ]);

        $response = $this->getJson('/api/bookings', $this->authHeaders(['sub' => $this->customerId]));

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.payment.status', 'success')
            ->assertJsonPath('data.0.rating.rating', 5)
            ->assertJsonPath('data.0.barbershop.address', 'Jl. Merdeka 1')
            ->assertJsonPath('data.0.service.name', 'Haircut')
            ->assertJsonPath('data.0.capster.name', 'Andi');
    }

    public function test_index_degrades_to_null_when_dependencies_are_down(): void
    {
        $this->makeBooking();

        Http::fake(['*' => Http::response([], 503)]);

        $this->getJson('/api/bookings', $this->authHeaders(['sub' => $this->customerId]))
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.payment', null)
            ->assertJsonPath('data.0.rating', null);
    }

    public function test_show_degrades_to_null_and_rejects_other_customers(): void
    {
        $booking = $this->makeBooking();

        Http::fake(['*' => Http::response([], 503)]);

        $this->getJson(
            '/api/bookings/'.$booking->id,
            $this->authHeaders(['sub' => $this->customerId]),
        )->assertStatus(200)
            ->assertJsonPath('payment', null)
            ->assertJsonPath('rating', null)
            ->assertJsonPath('id', $booking->id);

        $this->getJson(
            '/api/bookings/'.$booking->id,
            $this->authHeaders(['sub' => '99999999-9999-4999-8999-999999999999']),
        )->assertStatus(403);
    }

    public function test_shop_owner_can_view_a_customer_booking(): void
    {
        $booking = $this->makeBooking();

        Http::fake([
            'http://catalog-service/internal/barbershops/by-owner/*' => Http::response([
                'id' => $this->shopId,
                'user_id' => $this->ownerId,
                'name' => 'Brody Barbershop',
                'address' => 'Jl. Merdeka 1',
            ], 200),
            '*' => Http::response([], 200),
        ]);

        $this->getJson('/api/bookings/'.$booking->id, $this->authHeaders([
            'sub' => $this->ownerId,
            'role' => 'barbershop',
        ]))->assertStatus(200)->assertJsonPath('id', $booking->id);
    }
}
