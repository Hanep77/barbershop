<?php

namespace Tests\Feature;

use App\Models\BarbershopBalance;
use App\Models\LedgerEntry;
use App\Models\Withdrawal;
use App\Support\Outbox\OutboxEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\IssuesTokens;
use Tests\TestCase;

class WithdrawalTest extends TestCase
{
    use IssuesTokens;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.xendit.webhook_token' => 'test-webhook-token']);

        Http::fake([
            'http://catalog-service/*' => function ($request) {
                if (str_contains($request->url(), 'owner-missing')) {
                    return Http::response(['message' => 'Not found'], 404);
                }

                return Http::response([
                    'barbershop' => ['id' => 'shop-1', 'name' => 'Brody Barbershop'],
                ]);
            },
            'https://api.xendit.co/v2/payouts' => Http::response([
                'id' => 'payout-1',
                'status' => 'ACCEPTED',
            ]),
        ]);
    }

    private function setBalance(float $balance): void
    {
        BarbershopBalance::query()->updateOrCreate(
            ['barbershop_id' => 'shop-1'],
            ['balance' => $balance],
        );
    }

    private function makeWithdrawal(array $overrides = []): Withdrawal
    {
        return Withdrawal::query()->create(array_merge([
            'barbershop_id' => 'shop-1',
            'barbershop_owner_id' => 'owner-1',
            'amount' => 100000,
            'status' => 'pending',
            'bank_name' => 'BCA',
            'account_name' => 'Brody Owner',
            'account_number' => '1234567890',
            'external_id' => 'withdrawal-test-1',
        ], $overrides));
    }

    public function test_withdrawal_is_rejected_when_available_balance_is_insufficient(): void
    {
        $this->setBalance(100000);
        $this->makeWithdrawal(['amount' => 80000]);

        $this->postJson('/api/partner/barbershop/withdrawals', [
            'amount' => 50000,
            'bank_name' => 'BCA',
            'account_name' => 'Brody Owner',
            'account_number' => '1234567890',
        ], $this->authHeaders('owner-1', 'barbershop'))
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Saldo tidak mencukupi',
                'current_balance' => 100000,
                'pending_withdrawal' => 80000,
                'available_balance' => 20000,
                'requested_amount' => 50000,
            ]);
    }

    public function test_withdrawal_returns_not_found_when_owner_has_no_shop(): void
    {
        $this->postJson('/api/partner/barbershop/withdrawals', [
            'amount' => 10000,
            'bank_name' => 'BCA',
            'account_name' => 'Brody Owner',
            'account_number' => '1234567890',
        ], $this->authHeaders('owner-missing', 'barbershop'))->assertStatus(404);
    }

    public function test_successful_pending_withdrawal_flow(): void
    {
        $this->setBalance(500000);

        $this->postJson('/api/partner/barbershop/withdrawals', [
            'amount' => 100000,
            'bank_name' => 'BCA',
            'account_name' => 'Brody Owner',
            'account_number' => '1234567890',
        ], $this->authHeaders('owner-1', 'barbershop'))
            ->assertStatus(201)
            ->assertJson(['status' => 'pending']);

        $withdrawal = Withdrawal::query()->where('barbershop_id', 'shop-1')->first();

        $this->assertNotNull($withdrawal);
        $this->assertSame('pending', $withdrawal->status);
        $this->assertStringStartsWith('withdrawal-', $withdrawal->external_id);
        $this->assertSame('payout-1', $withdrawal->xendit_disbursement_id);
    }

    public function test_payout_webhook_debits_ledger_once(): void
    {
        $this->setBalance(500000);
        $withdrawal = $this->makeWithdrawal();

        $payload = [
            'data' => [
                'id' => 'payout-1',
                'reference_id' => 'withdrawal-test-1',
                'status' => 'SUCCEEDED',
            ],
        ];

        $this->postJson('/api/xendit/payout-webhook', $payload, ['x-callback-token' => 'test-webhook-token'])
            ->assertOk();

        $withdrawal->refresh();

        $this->assertSame('success', $withdrawal->status);
        $this->assertNotNull($withdrawal->processed_at);
        $this->assertSame(400000.0, (float) BarbershopBalance::query()->where('barbershop_id', 'shop-1')->value('balance'));
        $this->assertSame(1, LedgerEntry::query()->where('type', 'debit')->count());
        $this->assertSame(1, OutboxEvent::query()->where('type', 'WithdrawalSucceeded')->count());

        $this->postJson('/api/xendit/payout-webhook', $payload, ['x-callback-token' => 'test-webhook-token'])
            ->assertOk();

        $this->assertSame(1, LedgerEntry::query()->where('type', 'debit')->count());
        $this->assertSame(400000.0, (float) BarbershopBalance::query()->where('barbershop_id', 'shop-1')->value('balance'));
        $this->assertSame(1, OutboxEvent::query()->where('type', 'WithdrawalSucceeded')->count());
    }

    public function test_payout_webhook_rejects_invalid_token(): void
    {
        $this->makeWithdrawal();

        $this->postJson('/api/xendit/payout-webhook', [
            'reference_id' => 'withdrawal-test-1',
            'status' => 'SUCCEEDED',
        ], ['x-callback-token' => 'wrong'])->assertStatus(403);
    }

    public function test_failed_payout_webhook_marks_withdrawal_failed(): void
    {
        $this->setBalance(500000);
        $withdrawal = $this->makeWithdrawal();

        $this->postJson('/api/xendit/payout-webhook', [
            'reference_id' => 'withdrawal-test-1',
            'status' => 'FAILED',
            'failure_code' => 'INVALID_DESTINATION',
            'failure_reason' => 'Account is invalid',
        ], ['x-callback-token' => 'test-webhook-token'])->assertOk();

        $withdrawal->refresh();

        $this->assertSame('failed', $withdrawal->status);
        $this->assertSame('INVALID_DESTINATION', $withdrawal->failure_code);
        $this->assertSame(0, LedgerEntry::query()->count());
        $this->assertSame(1, OutboxEvent::query()->where('type', 'WithdrawalFailed')->count());
    }

    public function test_balance_endpoint_subtracts_pending_withdrawals(): void
    {
        $this->setBalance(500000);
        $this->makeWithdrawal(['amount' => 200000]);

        $this->getJson('/api/partner/barbershop/balance', $this->authHeaders('owner-1', 'barbershop'))
            ->assertOk()
            ->assertJson([
                'balance' => 500000,
                'pending_withdrawal' => 200000,
                'available_balance' => 300000,
            ]);
    }

    public function test_withdrawal_index_lists_shop_withdrawals(): void
    {
        $this->makeWithdrawal();

        $this->getJson('/api/partner/barbershop/withdrawals', $this->authHeaders('owner-1', 'barbershop'))
            ->assertOk()
            ->assertJsonPath('data.0.external_id', 'withdrawal-test-1');
    }
}
