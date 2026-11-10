<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesOwnedBarbershop;
use App\Models\Barbershop;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    use ResolvesOwnedBarbershop;

    public function index(Request $request, ?Barbershop $barbershop = null): JsonResponse
    {
        $barbershop ??= $this->ownedBarbershop($request);

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        return response()->json($barbershop->services()->with('category')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $barbershop = $this->ownedBarbershop($request);

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:255'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
            'category_id' => [
                'required',
                Rule::exists('service_categories', 'id')
                    ->where(fn ($query) => $query->where('barbershop_id', $barbershop->id)),
            ],
        ]);

        $validated['barbershop_id'] = $barbershop->id;

        $service = $barbershop->services()->create($validated);
        $service->load('category');

        return response()->json([
            'message' => 'Service created successfully',
            'service' => $service,
        ], 201);
    }

    public function show(Request $request, Service $service): JsonResponse
    {
        if (! $this->ownsBarbershop($request, $service->barbershop)) {
            return response()->json(['message' => 'You are not authorized to view this service'], 403);
        }

        return response()->json(['service' => $service->load('category')]);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        if (! $this->ownsBarbershop($request, $service->barbershop)) {
            return response()->json(['message' => 'You are not authorized to update this service'], 403);
        }

        $barbershopId = $service->barbershop_id;

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:255'],
            'duration_minutes' => ['sometimes', 'required', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
            'category_id' => [
                'sometimes',
                'required',
                Rule::exists('service_categories', 'id')
                    ->where(fn ($query) => $query->where('barbershop_id', $barbershopId)),
            ],
        ]);

        $service->update($validated);
        $service->load('category');

        return response()->json(['service' => $service]);
    }

    public function destroy(Request $request, Service $service): JsonResponse
    {
        if (! $this->ownsBarbershop($request, $service->barbershop)) {
            return response()->json(['message' => 'You are not authorized to delete this service'], 403);
        }

        $service->delete();

        return response()->json(['message' => 'deleted successfully']);
    }
}
