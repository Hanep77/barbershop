<?php

namespace Tests\Feature;

use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\IssuesTokens;
use Tests\TestCase;

class PaymentCreateTest extends TestCase
{
    use IssuesTokens;
    use RefreshDatabase;

    private function fakeServices(array $overrides = []): void
    {
        Http::fake(array_merge([
            'http://booking-service/internal/bookings/10' => Http::response([
                'booking' => [
                    'id' => 10,
                    'user_id' => 'user-1',
                    'user_email' => 'customer@example.com',
                    'barbershop_id' => 'shop-1',
                    'barbershop_owner_id' => 'owner-1',
                    'service_name' => 'Haircut',
                    'service_price' => 150000,
                    'status' => 'pending',
                ],
            ]),
            'http://booking-service/internal/bookings/11' => Http::response([
                'booking' => [
                    'id' => 11,
                    'user_id' => 'user-2',
                    'user_email' => 'other@example.com',
                    'barbershop_id' => 'shop-1',
                    'barbershop_owner_id' => 'owner-1',
                    'service_price' => 150000,
                    'status' => 'pending',
                ],
            ]),
            'https://api.xendit.co/v2/invoices' => Http::response([
                'id' => 'inv-10',
                'external_id' => 'booking-10',
                'invoice_url' => 'https://checkout.xendit.co/inv-10',
            ]),
            'http://catalog-service/internal/barbershops/by-owner/*' => Http::response([
                'barbershop' => ['id' => 'shop-1', 'name' => 'Brody Barbershop'],
            ]),
        ], $overrides));
    }

    public function test_cannot_create_payment_for_another_users_booking(): void
    {
        $this->fakeServices();

        $this->postJson('/api/payments/create', ['booking_id' => 11], $this->authHeaders('user-1'))
            ->assertStatus(403);

        $this->assertSame(0, Payment::query()->count());
    }

    public function test_returns_existing_payment_url_without_calling_xendit(): void
    {
        $this->fakeServices();

        Payment::query()->create([
            'booking_id' => 10,
            'user_id' => 'user-1',
            'barbershop_id' => 'shop-1',
            'barbershop_owner_id' => 'owner-1',
            'amount' => 150000,
            'status' => 'pending',
            'payment_url' => 'https://checkout.xendit.co/existing',
            'external_id' => 'booking-10',
        ]);

        $this->postJson('/api/payments/create', ['booking_id' => 10], $this->authHeaders('user-1'))
            ->assertOk()
            ->assertJson(['payment_url' => 'https://checkout.xendit.co/existing']);

        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'xendit.co/v2/invoices'));
    }

    public function test_creates_payment_and_persists_snapshots(): void
    {
        $this->fakeServices();

        $this->postJson('/api/payments/create', ['booking_id' => 10], $this->authHeaders('user-1'))
            ->assertOk()
            ->assertJson(['payment_url' => 'https://checkout.xendit.co/inv-10']);

        $this->assertDatabaseHas('payments', [
            'booking_id' => 10,
            'user_id' => 'user-1',
            'barbershop_id' => 'shop-1',
            'barbershop_owner_id' => 'owner-1',
            'amount' => 150000,
            'status' => 'pending',
            'transaction_id' => 'inv-10',
            'external_id' => 'booking-10',
            'payment_url' => 'https://checkout.xendit.co/inv-10',
        ]);

        Http::assertSent(fn ($request) => $request->url() === 'https://api.xendit.co/v2/invoices'
            && $request['external_id'] === 'booking-10'
            && $request['currency'] === 'IDR'
            && $request['payer_email'] === 'customer@example.com');
    }

    public function test_returns_404_when_booking_is_missing(): void
    {
        Http::fake([
            'http://booking-service/*' => Http::response(['message' => 'Not found'], 404),
        ]);

        $this->postJson('/api/payments/create', ['booking_id' => 999], $this->authHeaders('user-1'))
            ->assertStatus(404);
    }

    public function test_missing_payment_returns_404_for_owner(): void
    {
        $this->fakeServices();

        $this->getJson('/api/payments/10', $this->authHeaders('user-1'))
            ->assertStatus(404);
    }
}
