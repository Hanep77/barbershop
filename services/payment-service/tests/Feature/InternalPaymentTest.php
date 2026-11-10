<?php

namespace Tests\Feature;

use App\Models\BarbershopBalance;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class InternalPaymentTest extends TestCase
{
    use RefreshDatabase;

    private function internalHeaders(): array
    {
        return ['X-Internal-Token' => 'test-internal-token'];
    }

    private function makePayment(array $overrides = []): Payment
    {
        return Payment::query()->create(array_merge([
            'booking_id' => 700,
            'user_id' => 'user-1',
            'barbershop_id' => 'shop-1',
            'barbershop_owner_id' => 'owner-1',
            'amount' => 200000,
            'status' => 'success',
            'transaction_id' => 'inv-700',
            'xendit_payment_id' => 'pay-700',
            'external_id' => 'booking-700',
        ], $overrides));
    }

    public function test_internal_routes_require_internal_token(): void
    {
        $this->getJson('/internal/balances/shop-1')->assertStatus(403);

        $this->getJson('/internal/balances/shop-1', $this->internalHeaders())
            ->assertOk()
            ->assertJson(['balance' => 0, 'pending_withdrawal' => 0, 'available_balance' => 0]);
    }

    public function test_by_booking_returns_wrapped_payment(): void
    {
        $payment = $this->makePayment();

        $this->getJson('/internal/payments/by-booking/700', $this->internalHeaders())
            ->assertOk()
            ->assertJsonPath('payment.id', $payment->id);
    }

    public function test_by_bookings_returns_map(): void
    {
        $this->makePayment();
        $this->makePayment([
            'booking_id' => 701,
            'transaction_id' => 'inv-701',
            'xendit_payment_id' => 'pay-701',
            'external_id' => 'booking-701',
        ]);

        $this->postJson('/internal/payments/by-bookings', [
            'booking_ids' => [700, 701, 702],
        ], $this->internalHeaders())
            ->assertOk()
            ->assertJsonStructure(['payments' => ['700', '701']]);
    }

    public function test_refund_is_idempotent_and_calls_xendit_only_once(): void
    {
        $payment = $this->makePayment();

        Http::fake([
            'https://api.xendit.co/refunds' => Http::response([
                'id' => 'refund-700',
                'status' => 'PENDING',
            ]),
        ]);

        $this->postJson('/internal/payments/refund', [
            'booking_id' => 700,
            'amount' => 200000,
            'reason' => 'Customer request',
        ], $this->internalHeaders())
            ->assertOk()
            ->assertJson(['refund_status' => 'pending', 'refund_amount' => 200000]);

        $this->postJson('/internal/payments/refund', [
            'booking_id' => 700,
            'amount' => 200000,
            'reason' => 'Customer request',
        ], $this->internalHeaders())
            ->assertOk()
            ->assertJson(['refund_status' => 'pending', 'refund_amount' => 200000]);

        Http::assertSentCount(1);
        $this->assertSame('refund-700', $payment->refresh()->refund_id);
    }

    public function test_refund_is_skipped_when_payment_did_not_succeed(): void
    {
        $this->makePayment(['status' => 'pending', 'transaction_id' => null]);

        Http::fake();

        $this->postJson('/internal/payments/refund', [
            'booking_id' => 700,
            'amount' => 200000,
        ], $this->internalHeaders())
            ->assertOk()
            ->assertJson(['refund_status' => 'none', 'refund_amount' => 0]);

        Http::assertNothingSent();
    }

    public function test_stats_and_balance_are_derived_from_local_data(): void
    {
        $this->makePayment(['created_at' => now()]);
        $this->makePayment([
            'booking_id' => 701,
            'amount' => 100000,
            'transaction_id' => 'inv-701',
            'xendit_payment_id' => 'pay-701',
            'external_id' => 'booking-701',
            'created_at' => now()->subMonthNoOverflow(),
        ]);

        BarbershopBalance::query()->create([
            'barbershop_id' => 'shop-1',
            'balance' => 300000,
        ]);

        $this->getJson('/internal/payments/stats/shop-1', $this->internalHeaders())
            ->assertOk()
            ->assertJson([
                'revenue' => 300000,
                'current_month' => 200000,
                'last_month' => 100000,
                'revenue_change' => 100,
            ]);

        $this->getJson('/internal/balances/shop-1', $this->internalHeaders())
            ->assertOk()
            ->assertJson([
                'balance' => 300000,
                'pending_withdrawal' => 0,
                'available_balance' => 300000,
            ]);
    }
}
