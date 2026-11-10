<?php

namespace App\Services;

use App\Models\LedgerEntry;
use App\Models\BarbershopBalance;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Append-only shop ledger plus a transactional projection balance.
 */
final class LedgerService
{
    public function credit(
        string $barbershopId,
        float $amount,
        string $referenceType,
        string $referenceId,
        string $idempotencyKey,
        ?string $description = null,
    ): bool {
        return $this->record('credit', $barbershopId, $amount, $referenceType, $referenceId, $idempotencyKey, $description);
    }

    public function debit(
        string $barbershopId,
        float $amount,
        string $referenceType,
        string $referenceId,
        string $idempotencyKey,
        ?string $description = null,
    ): bool {
        return $this->record('debit', $barbershopId, $amount, $referenceType, $referenceId, $idempotencyKey, $description);
    }

    private function record(
        string $type,
        string $barbershopId,
        float $amount,
        string $referenceType,
        string $referenceId,
        string $idempotencyKey,
        ?string $description,
    ): bool {
        return DB::transaction(function () use ($type, $barbershopId, $amount, $referenceType, $referenceId, $idempotencyKey, $description): bool {
            if (LedgerEntry::query()->where('idempotency_key', $idempotencyKey)->exists()) {
                return false;
            }

            $projection = BarbershopBalance::query()
                ->where('barbershop_id', $barbershopId)
                ->lockForUpdate()
                ->first();

            if (! $projection) {
                try {
                    $projection = BarbershopBalance::query()->create([
                        'barbershop_id' => $barbershopId,
                        'balance' => 0,
                    ]);
                } catch (QueryException $e) {
                    if (! $this->isUniqueViolation($e)) {
                        throw $e;
                    }

                    $projection = BarbershopBalance::query()
                        ->where('barbershop_id', $barbershopId)
                        ->lockForUpdate()
                        ->first();
                }
            }

            if (! $projection) {
                throw new RuntimeException("Unable to lock balance projection for barbershop [{$barbershopId}]");
            }

            try {
                LedgerEntry::query()->create([
                    'barbershop_id' => $barbershopId,
                    'type' => $type,
                    'amount' => $amount,
                    'reference_type' => $referenceType,
                    'reference_id' => $referenceId,
                    'idempotency_key' => $idempotencyKey,
                    'description' => $description,
                ]);
            } catch (QueryException $e) {
                // Another worker inserted the same key first.
                if ($this->isUniqueViolation($e)) {
                    return false;
                }

                throw $e;
            }

            $delta = $type === 'credit' ? $amount : -$amount;
            $projection->balance = round((float) $projection->balance + $delta, 2);
            $projection->save();

            return true;
        });
    }

    private function isUniqueViolation(QueryException $e): bool
    {
        return $e instanceof UniqueConstraintViolationException
            || str_contains(strtolower($e->getMessage()), 'unique constraint')
            || str_contains(strtolower($e->getMessage()), 'duplicate entry');
    }
}
