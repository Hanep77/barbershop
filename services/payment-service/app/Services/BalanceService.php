<?php

namespace App\Services;

use App\Models\BarbershopBalance;
use App\Models\Withdrawal;

final class BalanceService
{
    /**
     * Balance summary derived from the ledger projection and pending payouts.
     *
     * @return array{balance: float, pending_withdrawal: float, available_balance: float}
     */
    public function summary(string $barbershopId): array
    {
        $balance = (float) (BarbershopBalance::query()
            ->where('barbershop_id', $barbershopId)
            ->value('balance') ?? 0);

        $pending = (float) Withdrawal::query()
            ->where('barbershop_id', $barbershopId)
            ->where('status', 'pending')
            ->sum('amount');

        return [
            'balance' => round($balance, 2),
            'pending_withdrawal' => round($pending, 2),
            'available_balance' => round(max(0, $balance - $pending), 2),
        ];
    }
}
