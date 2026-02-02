<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
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

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken("token")->plainTextToken;

        return response()->json([
            "user" => $user->only(["id", "name", "email", "role"]),
            "token" => $token
        ]);
    }

    public function register(Request $request)
    {
        try {

        $validated = $request->validate([
            "name" => ["required"],
            "email" => ["required", "email", "unique:users,email"],
            "role" => ["required"],
            "password" => ["required", "min:6", "confirmed"]
        ]);

        $validated["password"] = Hash::make($validated["password"]);
        $user = User::query()->create($validated);
        $token = $user->createToken("token")->plainTextToken;

        return response()->json([
            "user" => $user->only(["id", "name", "email", "role"]),
            "token" => $token
        ]);

        } catch (\Exception $e) {
            return response()->json([
                "message" => "Registration failed",
                "error" => $e->getMessage()
            ], 400);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json([
            "message" => "logout success"
        ]);
    }
}
