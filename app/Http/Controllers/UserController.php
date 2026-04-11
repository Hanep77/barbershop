<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            "email" => ["required", "email"],
            "password" => ["required", "min:6"]
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            "user" => $request->user()->only(["id", "name", "email", "role", "barbershop"]),
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            "name" => ["required"],
            "email" => ["required", "email", "unique:users,email"],
            "role" => ["required"],
            "password" => ["required", "min:6", "confirmed"]
        ]);

        $validated["password"] = Hash::make($validated["password"]);
        $user = User::query()->create($validated);
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            "user" => $user->only(["id", "name", "email", "role", "barbershop"]),
        ], 201);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            "message" => "logout success"
        ]);
    }
}
