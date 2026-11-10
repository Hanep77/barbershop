<?php

namespace App\Http\Controllers;

use App\Services\BalanceService;
use App\Support\BarbershopResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BalanceController extends Controller
{
    public function __construct(
        private readonly BarbershopResolver $shops,
        private readonly BalanceService $balances,
    ) {
    }

    public function show(Request $request): JsonResponse
    {
        $shop = $this->shops->byOwner((string) $request->user()->id);

        if (! $shop) {
            return response()->json(['message' => 'Barbershop tidak ditemukan'], 404);
        }

        return response()->json($this->balances->summary((string) $shop['id']));
    }
}
