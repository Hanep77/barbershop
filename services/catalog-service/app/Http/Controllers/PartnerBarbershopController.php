<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesOwnedBarbershop;
use App\Models\Barbershop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerBarbershopController extends Controller
{
    use ResolvesOwnedBarbershop;

    public function index(Request $request): JsonResponse
    {
        $barbershop = $this->ownedBarbershop($request);

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $barbershop->load(['images' => fn ($query) => $query->orderByDesc('is_primary')->latest()])
            ->loadAvg('ratings', 'rating')
            ->loadCount(['ratings', 'capsters'])
            ->loadMin('services', 'price');

        $user = $request->user();

        return response()->json([
            'barbershop' => $barbershop,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $barbershop = $this->ownedBarbershop($request);

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found for the user'], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'address' => ['sometimes', 'required', 'string'],
            'phone_number' => ['sometimes', 'required', 'string', 'max:15'],
            'description' => ['nullable', 'string'],
            'map_url' => ['nullable', 'string'],
            'latitude' => ['sometimes', 'required', 'string'],
            'longitude' => ['sometimes', 'required', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $barbershop->update($validated);

        return response()->json([
            'message' => 'Barbershop updated successfully',
            'barbershop' => $barbershop->fresh(),
        ]);
    }
}
