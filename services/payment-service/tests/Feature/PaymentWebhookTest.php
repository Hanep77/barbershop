<?php

namespace Tests\Feature;

use App\Models\LedgerEntry;
use App\Models\Payment;
use App\Support\Outbox\OutboxEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaymentWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.xendit.webhook_token' => 'test-webhook-token']);
    }

    private function makePayment(array $overrides = []): Payment
    {
        return Payment::query()->create(array_merge([
            'booking_id' => 501,
            'user_id' => '11111111-1111-1111-1111-111111111111',
            'barbershop_id' => '22222222-2222-2222-2222-222222222222',
            'barbershop_owner_id' => '33333333-3333-3333-3333-333333333333',
            'amount' => 150000,
            'status' => 'pending',
            'payment_method' => 'xendit',
            'payment_url' => 'https://checkout.xendit.co/inv-501',
            'transaction_id' => 'inv-501',
            'external_id' => 'booking-501',
        ], $overrides));
    }

    public function test_webhook_is_unavailable_when_token_is_not_configured(): void
    {
        config(['services.xendit.webhook_token' => null]);

        $this->postJson('/api/payments/webhook/xendit', [
            'external_id' => 'booking-501',
            'status' => 'PAID',
        ], ['x-callback-token' => 'anything'])->assertStatus(503);
    }

    public function test_webhook_rejects_wrong_token(): void
    {
        $this->postJson('/api/payments/webhook/xendit', [
            'external_id' => 'booking-501',
            'status' => 'PAID',
        ], ['x-callback-token' => 'wrong'])->assertStatus(401);
    }

    public function test_paid_webhook_updates_payment_credits_ledger_and_publishes_event(): void
    {
        $payment = $this->makePayment();

        $this->postJson('/api/payments/webhook/xendit', [
            'external_id' => 'booking-501',
            'status' => 'PAID',
            'id' => 'inv-501',
            'payment_id' => 'pay-501',
        ], ['x-callback-token' => 'test-webhook-token'])
            ->assertOk()
            ->assertJson(['message' => 'Webhook processed']);

        $payment->refresh();

        $this->assertSame('success', $payment->status);
        $this->assertSame('pay-501', $payment->xendit_payment_id);

        $this->assertDatabaseHas('ledger_entries', [
            'barbershop_id' => $payment->barbershop_id,
            'type' => 'credit',
            'idempotency_key' => 'payment:'.$payment->id,
        ]);

        $this->assertDatabaseHas('barbershop_balances', [
            'barbershop_id' => $payment->barbershop_id,
            'balance' => 150000,
        ]);

        $this->assertSame(1, OutboxEvent::query()->where('type', 'PaymentSucceeded')->count());
    }

    public function test_duplicate_paid_webhook_does_not_double_credit(): void
    {
        $payment = $this->makePayment();

        $payload = [
            'external_id' => 'booking-501',
            'status' => 'PAID',
            'payment_id' => 'pay-501',
        ];

        $this->postJson('/api/payments/webhook/xendit', $payload, ['x-callback-token' => 'test-webhook-token'])
            ->assertOk();

        $this->postJson('/api/payments/webhook/xendit', $payload, ['x-callback-token' => 'test-webhook-token'])
            ->assertOk()
            ->assertJson(['message' => 'Already processed']);

        $this->assertSame(1, LedgerEntry::query()->where('reference_type', 'payment')->count());
        $this->assertSame(150000.0, (float) LedgerEntry::query()->sum('amount'));
        $this->assertSame(1, OutboxEvent::query()->where('type', 'PaymentSucceeded')->count());
    }

    public function test_expired_webhook_marks_payment_failed_and_does_not_touch_booking_service(): void
    {
        Http::fake();

        $payment = $this->makePayment();

        $this->postJson('/api/payments/webhook/xendit', [
            'external_id' => 'booking-501',
            'status' => 'EXPIRED',
        ], ['x-callback-token' => 'test-webhook-token'])->assertOk();

        $this->assertSame('failed', $payment->refresh()->status);
        $this->assertSame(0, LedgerEntry::query()->count());
        $this->assertSame(1, OutboxEvent::query()->where('type', 'PaymentFailed')->count());
        Http::assertNothingSent();
    }

    public function test_refund_webhook_marks_success_and_debits_ledger_once(): void
    {
        $payment = $this->makePayment(['status' => 'success', 'xendit_payment_id' => 'pay-501']);
        $payment->update(['refund_status' => 'pending', 'refund_amount' => 150000]);

        $payload = [
            'invoice_id' => 'inv-501',
            'refund_id' => 'refund-1',
            'status' => 'SUCCEEDED',
            'amount' => 150000,
        ];

        $this->postJson('/api/xendit/refund-webhook', $payload, ['x-callback-token' => 'test-webhook-token'])
            ->assertOk();

        $this->assertSame('success', $payment->refresh()->refund_status);
        $this->assertSame(1, LedgerEntry::query()->where('type', 'debit')->count());
        $this->assertDatabaseHas('barbershop_balances', [
            'barbershop_id' => $payment->barbershop_id,
            'balance' => -150000,
        ]);

        $this->postJson('/api/xendit/refund-webhook', $payload, ['x-callback-token' => 'test-webhook-token'])
            ->assertOk();

        $this->assertSame(1, LedgerEntry::query()->where('type', 'debit')->count());
        $this->assertSame(1, OutboxEvent::query()->where('type', 'RefundSucceeded')->count());
    }
}
