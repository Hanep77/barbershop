<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\AuthContext;
use App\Support\InternalClient;
use App\Support\Jwt\TokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly TokenService $tokens)
    {
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        // Never trust a client-supplied role. Barbershop role is granted by
        // the catalog service after a shop is created.
        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'customer',
        ]);

        $pair = $this->tokens->issuePair($user, $request);

        return response()->json([
            'user' => $this->userPayload($user),
        ] + $pair, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::query()->where('email', $validated['email'])->first();

        if (! $user || ! $user->password || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $pair = $this->tokens->issuePair($user, $request);

        return response()->json([
            'user' => $this->userPayload($user),
        ] + $pair);
    }

    public function refresh(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        try {
            $result = $this->tokens->rotate($validated['refresh_token'], $request);
        } catch (\Throwable) {
            return response()->json(['message' => 'Invalid refresh token'], 401);
        }

        return response()->json([
            'user' => $this->userPayload($result['user']),
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'token_type' => $result['token_type'],
            'expires_in' => $result['expires_in'],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $refresh = (string) $request->input('refresh_token', '');

        if ($refresh !== '') {
            $this->tokens->revoke($refresh);
        }

        return response()->json(['message' => 'logout success']);
    }

    public function me(Request $request): JsonResponse
    {
        $context = $request->attributes->get('auth_context');

        if (! $context instanceof AuthContext) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user = User::query()->find($context->id);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json($this->userPayload($user));
    }

    private function userPayload(User $user): array
    {
        $payload = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'avatar' => $user->avatar,
            'email_verified_at' => $user->email_verified_at,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'barbershop' => null,
        ];

        if ($user->role === 'barbershop') {
            $shop = InternalClient::for('catalog')->tryGet('/internal/barbershops/by-owner/'.$user->id);
            $payload['barbershop'] = $shop['barbershop'] ?? null;
        }

        return $payload;
    }
}
