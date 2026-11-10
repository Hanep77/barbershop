<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Barbershop;
use Illuminate\Http\Request;

trait ResolvesOwnedBarbershop
{
    protected function ownedBarbershop(Request $request): ?Barbershop
    {
        $user = $request->user();

        if (! $user) {
            return null;
        }

        return Barbershop::query()->where('user_id', $user->id)->first();
    }

    protected function ownsBarbershop(Request $request, ?Barbershop $barbershop): bool
    {
        return $barbershop !== null
            && $request->user() !== null
            && $barbershop->user_id === $request->user()->id;
    }
}
