<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesOwnedBarbershop;
use App\Models\Barbershop;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceCategoryController extends Controller
{
    use ResolvesOwnedBarbershop;

    public function index(Request $request, ?Barbershop $barbershop = null): JsonResponse
    {
        $barbershop ??= $this->ownedBarbershop($request);

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $categories = ServiceCategory::query()
            ->where('barbershop_id', $barbershop->id)
            ->with('services')
            ->get();

        return response()->json([
            'message' => 'Service categories fetched successfully',
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $barbershop = $this->ownedBarbershop($request);

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $category = ServiceCategory::query()->create([
            'name' => $validated['name'],
            'barbershop_id' => $barbershop->id,
        ]);

        return response()->json([
            'message' => 'Service category created successfully',
            'category' => $category,
        ], 201);
    }

    public function show(Request $request, ServiceCategory $serviceCategory): JsonResponse
    {
        if (! $this->ownsBarbershop($request, $serviceCategory->barbershop)) {
            return response()->json(['message' => 'You are not authorized to view this service category'], 403);
        }

        return response()->json([
            'category' => $serviceCategory->load('services'),
        ]);
    }

    public function update(Request $request, ServiceCategory $serviceCategory): JsonResponse
    {
        if (! $this->ownsBarbershop($request, $serviceCategory->barbershop)) {
            return response()->json(['message' => 'You are not authorized to update this service category'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $serviceCategory->update($validated);

        return response()->json([
            'message' => 'Service category updated successfully',
            'category' => $serviceCategory->fresh(),
        ]);
    }

    public function destroy(Request $request, ServiceCategory $serviceCategory): JsonResponse
    {
        if (! $this->ownsBarbershop($request, $serviceCategory->barbershop)) {
            return response()->json(['message' => 'You are not authorized to delete this service category'], 403);
        }

        $serviceCategory->delete();

        return response()->json([
            'message' => 'Service category deleted successfully',
        ]);
    }
}
