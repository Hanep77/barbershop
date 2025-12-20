<?php

namespace App\Http\Controllers;

use App\Models\Barbershop;
use Illuminate\Http\Request;

class BarbershopController extends Controller
{
    public function index()
    {
        return Barbershop::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            "name" => ["required", "max:100"],
            "address" => ["required"],
            "map_url" => ["nullabled"],
            "phone_number" => ["required", "max:15"],
            "description" => ["nullable"],
            "is_active" => ["nullable"],
        ]);

        $validated["user_id"] = $request->user()->id;
        $barbershop = Barbershop::query()->create($validated);

        return response()->json($barbershop);
    }
}
