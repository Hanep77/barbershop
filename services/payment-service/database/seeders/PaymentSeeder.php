<?php

namespace Database\Seeders;

use App\Models\LedgerEntry;
use App\Models\Payment;
use Illuminate\Database\Seeder;

/**
 * Seeds payments for every demo booking plus the matching ledger entries:
 *
 *   pending booking      -> payment pending
 *   completed / confirmed-> payment success (credit)
 *   cancelled            -> payment success + successful refund (credit + debit)
 *
 * The credit/debit rules mirror PaymentController and LedgerService
 * (idempotency keys "payment:{payment_id}" and "refund:{payment_id}:...").
 */
class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        foreach (DemoFixtures::bookings() as $booking) {
            $paymentId = DemoFixtures::id('payment.booking.'.$booking['id']);
            $paid = $booking['payment_status'] === 'success';
            $refunded = (bool) $booking['refunded'];

            /** @var Payment $payment */
            $payment = Payment::query()->find($paymentId) ?? new Payment;

            $payment->forceFill([
                'id' => $paymentId,
                'booking_id' => $booking['id'],
                'user_id' => $booking['user_id'],
                'barbershop_id' => $booking['shop_id'],
                'barbershop_owner_id' => $booking['owner_id'],
                'amount' => $booking['service_price'],
                'status' => $booking['payment_status'],
                'payment_method' => 'xendit',
                'payment_url' => $paid
                    ? 'https://checkout.xendit.co/web/demo-'.$booking['id']
                    : null,
                'transaction_id' => 'demo-invoice-'.$booking['id'],
                'xendit_payment_id' => $paid ? 'demo-payment-'.$booking['id'] : null,
                'external_id' => 'booking-'.$booking['id'],
                'refund_status' => $refunded ? 'success' : 'none',
                'refund_amount' => $refunded ? $booking['service_price'] : 0,
                'refund_id' => $refunded ? 'demo-refund-'.$booking['id'] : null,
                'created_at' => $booking['created_at'],
                'updated_at' => $booking['created_at'],
            ])->save();

            if (! $paid) {
                continue;
            }

            $this->ledger(
                key: 'payment:'.$paymentId,
                barbershopId: $booking['shop_id'],
                type: 'credit',
                amount: (float) $booking['service_price'],
                referenceType: 'payment',
                referenceId: $paymentId,
                description: 'Booking payment',
                at: $booking['created_at'],
            );

            if ($refunded) {
                $this->ledger(
                    key: 'refund:'.$paymentId.':demo',
                    barbershopId: $booking['shop_id'],
                    type: 'debit',
                    amount: (float) $booking['service_price'],
                    referenceType: 'refund',
                    referenceId: $paymentId,
                    description: 'Booking refund',
                    at: $booking['created_at'],
                );
            }
        }
    }

    private function ledger(
        string $key,
        string $barbershopId,
        string $type,
        float $amount,
        string $referenceType,
        string $referenceId,
        string $description,
        string $at,
    ): void {
        LedgerEntry::query()->updateOrCreate(
            ['idempotency_key' => $key],
            [
                'barbershop_id' => $barbershopId,
                'type' => $type,
                'amount' => $amount,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'description' => $description,
                'created_at' => $at,
                'updated_at' => $at,
            ],
        );
    }
}
