<?php

namespace App\Http\Controllers;

use App\Models\Barbershop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class BarbershopController extends Controller
{
    public function index()
    {
        return Barbershop::all();
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->barbershop()->exists()) {
            return response()->json([
                'message' => 'User already has a barbershop'
            ], 409);
        }

        $validated = $request->validate([
            "name" => ["required", "max:100"],
            "address" => ["required"],
            "map_url" => ["nullabled"],
            "phone_number" => ["required", "max:15"],
            "description" => ["nullable"],
            "is_active" => ["nullable"],
        ]);

        $validated["user_id"] = $user->id;
        $barbershop = Barbershop::query()->create($validated);

        if ($barbershop) {
            $user->update([
                "role" => "barbershop"
            ]);
        }

        return response()->json($barbershop);
    }

    public function show(Barbershop $barbershop)
    {
        return response()->json($barbershop->load("services"));
    }

    public function update(Request $request, Barbershop $barbershop)
    {
        Gate::authorize("update", $barbershop);

        $validated = $request->validate([
            "name" => ["required", "sometimes", "max:100"],
            "address" => ["required", "sometimes"],
            "map_url" => ["nullable"],
            "phone_number" => ["required", "sometimes", "max:15"],
            "description" => ["nullable"],
            "is_active" => ["nullable"],
        ]);

        $barbershop->update($validated);

        return response()->json($barbershop);
    }

    public function destroy(Barbershop $barbershop)
    {
        if ($barbershop->delete()) {
            return response()->json([
                "message" => "deleted successfully"
            ]);
        }
    }
}
