<?php

namespace App\Http\Controllers;

use App\Models\Barbershop;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ServiceController extends Controller
{
    public function index(Request $request, Barbershop $barbershop = null)
    {
        if (!$barbershop) {
            $barbershop = $request->user()->barbershop;
        }

        if (!$barbershop) {
            return response()->json([
                "message" => "Barbershop not found",
            ], 404);
        }

        $services = $barbershop->services()->with("category")->get();

        return response()->json($services, 200);
    }

    public function store(Request $request)
    {
        $barbershop = $request->user()->barbershop;

        Gate::authorize("update", $barbershop);

        $validated = $request->validate([
            "name" => ["required", "max:100"],
            "price" => ["required"],
            "description" => ["nullable", "max:255", "string"],
            "duration_minutes" => ["required"],
            "is_active" => ["nullable"],
            "category_id" => ["required", "exists:service_categories,id"],
        ]);

        $validated["barbershop_id"] = $barbershop->id;

        $service = $barbershop->services()->create($validated);

        $service->load("category");

        return response()->json([
            "message" => "Service created successfully",
            "service" => $service
        ], 201);
    }

    public function update(Request $request, Service $service)
    {
        Gate::authorize("update", $service);

        $validated = $request->validate([
            "name" => ["required", "sometimes", "max:100"],
            "price" => ["required", "sometimes"],
            "duration_minutes" => ["required", "sometimes"],
            "category_id" => ["required", "sometimes", "exists:service_categories,id"],
            "is_active" => ["nullable"],
            "description" => ["nullable", "max:255", "string"],
        ]);

        $service->update($validated);

        $service->load("category");


        return response()->json([
            "service" => $service->only(["id",   "name",  "price",  "description", "duration_minutes", "is_active", "category"]),
        ], 200);
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
