<?php

namespace App\Http\Controllers;

use App\Models\Barbershop;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $barbershop = $request->user()->barbershop;

        return response()->json($barbershop->services, 200);
    }

    public function store(Request $request)
    {
        $barbershop = $request->user()->barbershop;

        Gate::authorize("update", $barbershop);

        $validated = $request->validate([
            "name" => ["required", "max:100"],
            "price" => ["required"],
            "duration_minutes" => ["required"],
            "is_active" => ["nullable"],
        ]);

        $service = $barbershop->services()->create($validated);

        return response()->json($service);
    }

    public function update(Request $request, Service $service)
    {
        Gate::authorize("update", $service);

        $validated = $request->validate([
            "name" => ["required", "sometimes", "max:100"],
            "price" => ["required", "sometimes"],
            "duration_minutes" => ["required", "sometimes"],
            "is_active" => ["nullable"],
        ]);

        $service->update($validated);

        return response()->json($service);
    }

    public function destroy(Service $service)
    {
        Gate::authorize("update", $service);

        if ($service->delete()) {
            return response()->json([
                "message" => "deleted successfully"
            ]);
        }
    }
}
