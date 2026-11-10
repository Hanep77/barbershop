<?php

namespace App\Http\Controllers;

use App\Models\Barbershop;
use App\Models\Capster;
use App\Models\Rating;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InternalCatalogController extends Controller
{
    public function showBarbershop(string $id): JsonResponse
    {
        $barbershop = Barbershop::query()->find($id);

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        return response()->json(['barbershop' => $barbershop->toInternalSummary()]);
    }

    public function byOwner(string $userId): JsonResponse
    {
        $barbershop = Barbershop::query()->where('user_id', $userId)->first();

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        return response()->json(['barbershop' => $barbershop->toInternalSummary()]);
    }

    public function batch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['present', 'array'],
            'ids.*' => ['string'],
        ]);

        $barbershops = Barbershop::query()
            ->whereIn('id', $validated['ids'])
            ->get()
            ->mapWithKeys(fn (Barbershop $barbershop) => [
                $barbershop->id => $barbershop->toInternalSummary(),
            ])
            ->all();

        return response()->json(['barbershops' => (object) $barbershops]);
    }

    public function showService(string $id): JsonResponse
    {
        $service = Service::query()->find($id);

        if (! $service) {
            return response()->json(['message' => 'Service not found'], 404);
        }

        return response()->json([
            'service' => [
                'id' => $service->id,
                'barbershop_id' => $service->barbershop_id,
                'name' => $service->name,
                'price' => $service->price,
                'duration_minutes' => $service->duration_minutes,
                'is_active' => (bool) $service->is_active,
            ],
        ]);
    }

    public function showCapster(string $id): JsonResponse
    {
        $capster = Capster::query()->find($id);

        if (! $capster) {
            return response()->json(['message' => 'Capster not found'], 404);
        }

        return response()->json([
            'capster' => [
                'id' => $capster->id,
                'barbershop_id' => $capster->barbershop_id,
                'name' => $capster->name,
                'is_available' => (bool) $capster->is_available,
            ],
        ]);
    }

    public function validateBooking(Request $request): JsonResponse
    {
        $barbershop = Barbershop::query()->find((string) $request->input('barbershop_id'));

        if (! $barbershop || ! $barbershop->is_active) {
            return $this->invalid('Barbershop is not available');
        }

        $service = Service::query()->find((string) $request->input('service_id'));

        if (! $service || $service->barbershop_id !== $barbershop->id) {
            return $this->invalid('Service does not belong to this barbershop');
        }

        if (! $service->is_active) {
            return $this->invalid('Service is not active');
        }

        $capster = Capster::query()->find((string) $request->input('capster_id'));

        if (! $capster || $capster->barbershop_id !== $barbershop->id) {
            return $this->invalid('Capster does not belong to this barbershop');
        }

        return response()->json([
            'valid' => true,
            'barbershop' => $barbershop->toInternalSummary(),
            'service' => [
                'id' => $service->id,
                'name' => $service->name,
                'price' => $service->price,
                'duration_minutes' => $service->duration_minutes,
                'is_active' => (bool) $service->is_active,
            ],
            'capster' => [
                'id' => $capster->id,
                'name' => $capster->name,
                'barbershop_id' => $capster->barbershop_id,
            ],
        ]);
    }

    public function stats(string $id): JsonResponse
    {
        $barbershop = Barbershop::query()->find($id);

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $activeCapsters = Capster::query()
            ->where('barbershop_id', $barbershop->id)
            ->where('is_available', true)
            ->count();

        $averageRating = (float) (Rating::query()
            ->where('barbershop_id', $barbershop->id)
            ->avg('rating') ?? 0);

        $lastMonthRating = (float) (Rating::query()
            ->where('barbershop_id', $barbershop->id)
            ->whereBetween('created_at', [
                now()->subMonthNoOverflow()->startOfMonth(),
                now()->subMonthNoOverflow()->endOfMonth(),
            ])
            ->avg('rating') ?? 0);

        return response()->json([
            'active_capsters' => $activeCapsters,
            'average_rating' => round($averageRating, 1),
            'rating_change' => round($averageRating - $lastMonthRating, 1),
        ]);
    }

    private function invalid(string $message): JsonResponse
    {
        return response()->json([
            'valid' => false,
            'message' => $message,
        ], 422);
    }
}
