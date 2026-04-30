<?php

namespace App\Http\Controllers;

use App\Http\Requests\WithdrawalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WithdrawalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $barbershop = $request->user()?->barbershop;

        if (! $barbershop) {
            return response()->json([
                'message' => 'Barbershop tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'message' => 'Riwayat withdraw berhasil diambil',
            'data' => $barbershop->withdrawals()->latest()->get(),
        ]);
    }

    public function store(WithdrawalRequest $request): JsonResponse
    {
        $barbershop = $request->user()?->barbershop;

        if (! $barbershop) {
            return response()->json([
                'message' => 'Barbershop tidak ditemukan',
            ], 404);
        }

        if ((float) $barbershop->balance < (float) $request->amount) {
            return response()->json([
                'message' => 'Saldo tidak mencukupi',
            ], 422);
        }

        $withdrawal = DB::transaction(function () use ($barbershop, $request) {
            $withdrawal = $barbershop->withdrawals()->create([
                'amount' => $request->amount,
                'status' => 'pending',
                'bank_name' => $request->bank_name,
                'account_number' => $request->account_number,
            ]);

            $isSuccess = rand(0, 1) === 1;

            if ($isSuccess) {
                $withdrawal->update(['status' => 'success']);
                $barbershop->decrement('balance', $request->amount);
            } else {
                $withdrawal->update(['status' => 'failed']);
            }

            return $withdrawal->fresh();
        });

        if ($withdrawal->status === 'success') {
            return response()->json([
                'message' => 'Withdraw berhasil',
                'status' => 'success',
            ]);
        }

        return response()->json([
            'message' => 'Withdraw gagal',
            'status' => 'failed',
        ]);
    }
}
