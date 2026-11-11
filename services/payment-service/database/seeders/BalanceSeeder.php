<?php

namespace Database\Seeders;

use App\Models\BarbershopBalance;
use App\Models\LedgerEntry;
use Illuminate\Database\Seeder;

/**
 * Rebuilds the barbershop_balances projection from the seeded ledger so the
 * partner dashboard shows a coherent balance after seeding.
 */
class BalanceSeeder extends Seeder
{
    public function run(): void
    {
        foreach (DemoFixtures::shops() as $shop) {
            $shopId = DemoFixtures::id($shop['key']);

            $credits = (float) LedgerEntry::query()
                ->where('barbershop_id', $shopId)
                ->where('type', 'credit')
                ->sum('amount');

            $debits = (float) LedgerEntry::query()
                ->where('barbershop_id', $shopId)
                ->where('type', 'debit')
                ->sum('amount');

            BarbershopBalance::query()->updateOrCreate(
                ['barbershop_id' => $shopId],
                ['balance' => round($credits - $debits, 2)],
            );
        }
    }
}
