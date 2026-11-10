<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesOwnedBarbershop;
use App\Models\Barbershop;
use App\Models\Capster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CapsterController extends Controller
{
    use ResolvesOwnedBarbershop;

    public function index(Request $request, ?Barbershop $barbershop = null): JsonResponse
    {
        $barbershop ??= $this->ownedBarbershop($request);

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $capsters = Capster::query()
            ->where('barbershop_id', $barbershop->id)
            ->get();

        return response()->json([
            'message' => 'Capsters fetched successfully',
            'capsters' => $capsters,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $barbershop = $this->ownedBarbershop($request);

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found for the authenticated user'], 404);
        }

        $validated = $request->validate($this->rules());

        $validated['barbershop_id'] = $barbershop->id;
        $validated['title'] = $validated['title'] ?? '';
        $validated['experience'] = $validated['experience'] ?? '';
        $validated['phone'] = $validated['phone'] ?? '';
        $validated['bio'] = $validated['bio'] ?? '';
        $validated['specialties'] = $validated['specialties'] ?? [];
        $validated['rating'] = $validated['rating'] ?? 0;
        $validated['image'] = $validated['image']
            ?? 'https://ui-avatars.com/api/?name='.urlencode($validated['name']);

        $capster = Capster::query()->create($validated);

        return response()->json([
            'message' => 'Capster created successfully',
            'capster' => $capster,
        ], 201);
    }

    public function show(Request $request, Capster $capster): JsonResponse
    {
        if (! $this->ownsBarbershop($request, $capster->barbershop)) {
            return response()->json(['message' => 'You are not authorized to view this capster'], 403);
        }

        return response()->json(['capster' => $capster]);
    }

    public function update(Request $request, Capster $capster): JsonResponse
    {
        if (! $this->ownsBarbershop($request, $capster->barbershop)) {
            return response()->json(['message' => 'You are not authorized to update this capster'], 403);
        }

        $validated = $request->validate($this->rules(partial: true));

        // These columns are non-nullable; omit explicit nulls instead of failing.
        $capster->update(array_filter($validated, fn ($value) => $value !== null));

        return response()->json([
            'message' => 'Capster updated successfully',
            'capster' => $capster->fresh(),
        ]);
    }

    public function destroy(Request $request, Capster $capster): JsonResponse
    {
        if (! $this->ownsBarbershop($request, $capster->barbershop)) {
            return response()->json(['message' => 'You are not authorized to delete this capster'], 403);
        }

        $capster->delete();

        return response()->json([
            'message' => 'Capster deleted successfully',
        ]);
    }

    public function toggleStatus(Request $request, Capster $capster): JsonResponse
    {
        if (! $this->ownsBarbershop($request, $capster->barbershop)) {
            return response()->json(['message' => 'You are not authorized to update this capster'], 403);
        }

        $capster->update(['is_available' => ! $capster->is_available]);

        return response()->json([
            'message' => 'Capster status updated successfully',
            'capster' => $capster->fresh(),
        ]);
    }

    private function rules(bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'experience' => ['nullable', 'string', 'max:255'],
            'rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'specialties' => ['nullable', 'array'],
            'specialties.*' => ['string'],
            'phone' => ['nullable', 'string', 'max:20'],
            'bio' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:2048'],
            'is_available' => ['sometimes', 'boolean'],
        ];
    }
}
