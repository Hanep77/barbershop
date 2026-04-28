<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Transaction;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // $transactions = Transaction::where('status', 'confirmed')->get();

        // foreach ($transactions as $transaction) {
        //     Payment::create([
        //         'booking_id' => $transaction->id, // Note: this is transaction id, as per migration
        //         'amount' => $transaction->amount,
        //         'status' => 'success', // Assume successful for completed transactions
        //         'payment_method' => $transaction->payment_method,
        //         'transaction_id' => 'TXN' . strtoupper(uniqid()),
        //     ]);
        // }
    }
}
