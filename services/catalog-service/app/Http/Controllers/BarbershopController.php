<?php

namespace App\Http\Controllers;

use App\Models\Barbershop;
use App\Support\InternalClient;
use App\Support\Outbox\EventPublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class BarbershopController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $barbershops = Barbershop::query()
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->withAvg('ratings', 'rating')
            ->withCount('ratings')
            ->withMin('services', 'price')
            ->with(['images' => fn ($query) => $query->orderByDesc('is_primary')->latest()])
            ->get();

        return response()->json($barbershops);
    }

    public function show(Barbershop $barbershop): JsonResponse
    {
        $barbershop->load([
            'services',
            'capsters',
            'primaryImage',
            'images' => fn ($query) => $query->orderByDesc('is_primary')->latest(),
        ])
            ->loadAvg('ratings', 'rating')
            ->loadCount(['ratings', 'capsters'])
            ->loadMin('services', 'price');

        return response()->json($barbershop);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (Barbershop::withTrashed()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'User already has a barbershop',
            ], 409);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'address' => ['required', 'string'],
            'map_url' => ['nullable', 'string'],
            'phone_number' => ['required', 'string', 'max:15'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'latitude' => ['required', 'string'],
            'longitude' => ['required', 'string'],
        ]);

        $validated['user_id'] = $user->id;

        $barbershop = DB::transaction(function () use ($validated, $user) {
            $shop = Barbershop::query()->create($validated);

            // Async fallback in case the synchronous role promotion below
            // fails: identity consumes this event and promotes the user.
            EventPublisher::publish('BarbershopCreated', [
                'barbershop_id' => $shop->id,
                'user_id' => $user->id,
            ]);

            return $shop;
        });

        // The identity service owns the user record. A promotion failure must
        // not roll back the shop that was already created locally.
        try {
            InternalClient::for('identity')->patch("/internal/users/{$user->id}/role", [
                'role' => 'barbershop',
            ]);
        } catch (Throwable $e) {
            Log::warning('Failed to promote user role after barbershop creation', [
                'user_id' => $user->id,
                'barbershop_id' => $barbershop->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => 'barbershop',
                'avatar' => $user->avatar,
                'barbershop' => $barbershop,
            ],
        ], 201);
    }

    public function update(Request $request, Barbershop $barbershop): JsonResponse
    {
        if ($barbershop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'You are not authorized to update this barbershop'], 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'address' => ['sometimes', 'required', 'string'],
            'map_url' => ['nullable', 'string'],
            'phone_number' => ['sometimes', 'required', 'string', 'max:15'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'latitude' => ['sometimes', 'required', 'string'],
            'longitude' => ['sometimes', 'required', 'string'],
        ]);

        $barbershop->update($validated);

        return response()->json($barbershop->fresh());
    }

    public function destroy(Request $request, Barbershop $barbershop): JsonResponse
    {
        if ($barbershop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'You are not authorized to delete this barbershop'], 403);
        }

        $barbershop->delete();

        return response()->json(['message' => 'deleted successfully']);
    }
}
