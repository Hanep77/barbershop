<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InternalUserController extends Controller
{
    public function show(string $id): JsonResponse
    {
        $user = User::query()->find($id);

        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json($this->payload($user));
    }

    public function batch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['string'],
        ]);

        $users = User::query()->whereIn('id', $validated['ids'])->get()
            ->mapWithKeys(fn (User $user) => [$user->id => $this->payload($user)]);

        return response()->json(['users' => $users]);
    }

    public function updateRole(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'in:customer,barbershop'],
        ]);

        $user = User::query()->find($id);

        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->update(['role' => $validated['role']]);

        // Access tokens keep the old role until they expire or are refreshed.
        // Existing refresh tokens stay valid so the client can obtain a token
        // with the new role immediately.
        return response()->json(['user' => $this->payload($user)]);
    }

    private function payload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'avatar' => $user->avatar,
        ];
    }
}
