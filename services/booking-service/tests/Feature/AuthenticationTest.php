<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\IssuesTokens;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use IssuesTokens, RefreshDatabase;

    public function test_booking_routes_require_authentication(): void
    {
        $this->getJson('/api/bookings')->assertStatus(401);
        $this->postJson('/api/bookings', [])->assertStatus(401);
        $this->getJson('/api/partner/barbershop/bookings')->assertStatus(401);
    }

    public function test_internal_routes_require_the_internal_token(): void
    {
        $this->getJson('/internal/bookings/1')->assertStatus(403);
    }

    public function test_customer_cannot_access_partner_routes(): void
    {
        $this->getJson('/api/partner/barbershop/bookings', $this->authHeaders(['role' => 'customer']))
            ->assertStatus(403);

        $this->getJson('/api/partner/barbershop/dashboard/stats', $this->authHeaders(['role' => 'customer']))
            ->assertStatus(403);
    }

    public function test_barbershop_user_cannot_create_a_booking(): void
    {
        $this->postJson('/api/bookings', [
            'barbershop_id' => '33333333-3333-4333-8333-333333333333',
            'service_id' => '44444444-4444-4444-8444-444444444444',
            'capster_id' => '55555555-5555-4555-8555-555555555555',
            'booking_date' => now()->addDay()->toDateString(),
            'booking_time' => '10:00',
        ], $this->authHeaders(['role' => 'barbershop']))->assertStatus(403);
    }
}
