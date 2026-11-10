<?php

namespace App\Http\Controllers;

use App\Models\Barbershop;
use App\Models\Capster;
use App\Models\Rating;
use App\Support\InternalClient;
use App\Support\Outbox\EventPublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Throwable;

class RatingController extends Controller
{
    public function index(Barbershop $barbershop): JsonResponse
    {
        $ratings = Rating::query()
            ->where('barbershop_id', $barbershop->id)
            ->with(['capster' => fn ($query) => $query->select(
                'id',
                'barbershop_id',
                'name',
                'title',
                'image',
                'rating',
            )])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $ratings]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'barbershop_id' => ['required', 'uuid', Rule::exists('barbershops', 'id')],
            'booking_id' => ['required', 'integer', 'min:1'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        if (Rating::query()->where('booking_id', $validated['booking_id'])->exists()) {
            return response()->json(['message' => 'Pesanan ini sudah pernah direview.'], 400);
        }

        try {
            $booking = InternalClient::for('booking')->post(
                "/internal/bookings/{$validated['booking_id']}/validate-review",
                ['user_id' => $user->id],
            );
        } catch (Throwable $e) {
            Log::warning('Failed to validate review with booking service', [
                'booking_id' => $validated['booking_id'],
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Booking service unavailable'], 503);
        }

        $isValid = ($booking['valid'] ?? false) === true
            && ($booking['status'] ?? null) === 'completed'
            && ($booking['user_id'] ?? null) === $user->id;

        if (! $isValid) {
            return response()->json([
                'message' => 'Review hanya dapat diberikan untuk pesanan yang sudah selesai.',
            ], 400);
        }

        if (isset($booking['barbershop_id']) && $booking['barbershop_id'] !== $validated['barbershop_id']) {
            return response()->json([
                'message' => 'Pesanan tidak sesuai dengan barbershop ini.',
            ], 422);
        }

        $barbershop = Barbershop::query()->findOrFail($validated['barbershop_id']);
        $capsterId = $booking['capster_id'] ?? null;

        $rating = DB::transaction(function () use ($validated, $user, $barbershop, $capsterId) {
            $rating = Rating::query()->create([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_avatar' => $user->avatar,
                'barbershop_id' => $barbershop->id,
                'capster_id' => $capsterId,
                'booking_id' => $validated['booking_id'],
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);

            $this->recomputeAverages($barbershop->id, $capsterId);

            EventPublisher::publish('ReviewCreated', [
                'rating_id' => $rating->id,
                'barbershop_owner_id' => $barbershop->user_id,
                'barbershop_name' => $barbershop->name,
                'user_name' => $user->name,
                'rating' => $rating->rating,
                'comment' => $rating->comment,
            ]);

            return $rating;
        });

        return response()->json([
            'message' => 'Review berhasil dikirim!',
            'data' => $rating->load('capster'),
        ], 201);
    }

    public function update(Request $request, Rating $rating): JsonResponse
    {
        if ($rating->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($rating, $validated) {
            $rating->update($validated);
            $this->recomputeAverages($rating->barbershop_id, $rating->capster_id);
        });

        return response()->json([
            'message' => 'Review berhasil diperbarui!',
            'data' => $rating->fresh()->load('capster'),
        ]);
    }

    public function destroy(Request $request, Rating $rating): JsonResponse
    {
        if ($rating->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $barbershopId = $rating->barbershop_id;
        $capsterId = $rating->capster_id;

        DB::transaction(function () use ($rating, $barbershopId, $capsterId) {
            $rating->delete();
            $this->recomputeAverages($barbershopId, $capsterId);
        });

        return response()->json(['message' => 'Review berhasil dihapus!']);
    }

    private function recomputeAverages(string $barbershopId, ?string $capsterId): void
    {
        $barbershopAverage = Rating::query()->where('barbershop_id', $barbershopId)->avg('rating') ?? 0;
        Barbershop::query()->whereKey($barbershopId)->update(['rating' => round((float) $barbershopAverage, 2)]);

        if ($capsterId !== null) {
            $capsterAverage = Rating::query()->where('capster_id', $capsterId)->avg('rating') ?? 0;
            Capster::query()->whereKey($capsterId)->update(['rating' => round((float) $capsterAverage, 2)]);
        }
    }
}
