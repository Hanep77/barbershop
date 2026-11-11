<?php

namespace Database\Seeders;

use App\Models\LedgerEntry;
use App\Models\Withdrawal;
use Illuminate\Database\Seeder;

/**
 * Seeds two payouts for the first demo shop: one settled (with the matching
 * ledger debit) and one still pending.
 */
class WithdrawalSeeder extends Seeder
{
    public function run(): void
    {
        $shopId = DemoFixtures::id('shop.1');
        $ownerId = DemoFixtures::id('owner.1');

        foreach (DemoFixtures::withdrawals() as $definition) {
            /** @var Withdrawal $withdrawal */
            $withdrawal = Withdrawal::query()->updateOrCreate(
                ['external_id' => $definition['external_id']],
                [
                    'barbershop_id' => $shopId,
                    'barbershop_owner_id' => $ownerId,
                    'amount' => $definition['amount'],
                    'status' => $definition['status'],
                    'bank_name' => $definition['bank_name'],
                    'account_name' => $definition['account_name'],
                    'account_number' => $definition['account_number'],
                    'xendit_disbursement_id' => $definition['xendit_disbursement_id'],
                    'xendit_status' => $definition['xendit_status'],
                    'processed_at' => $definition['processed_at'],
                ],
            );

            if ($withdrawal->status !== 'success') {
                continue;
            }

            $at = ($definition['processed_at'] ?? now())->toDateTimeString();

            LedgerEntry::query()->updateOrCreate(
                ['idempotency_key' => 'withdrawal:'.$withdrawal->id],
                [
                    'barbershop_id' => $shopId,
                    'type' => 'debit',
                    'amount' => $definition['amount'],
                    'reference_type' => 'withdrawal',
                    'reference_id' => (string) $withdrawal->id,
                    'description' => 'Partner withdrawal',
                    'created_at' => $at,
                    'updated_at' => $at,
                ],
            );
        }
    }
}
