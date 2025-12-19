<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function login() {}

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
        $token = $user->createToken("token")->plainTextToken;

        return response()->json([
            "user" => $user->only(["id", "name", "email", "role"]),
            "token" => $token
        ]);
    }
}
