<?php

namespace App\Http\Controllers;

use App\Models\Rating;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InternalRatingController extends Controller
{
    public function byBookings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_ids' => ['present', 'array'],
            'booking_ids.*' => ['integer'],
        ]);

        $ratings = Rating::query()
            ->whereIn('booking_id', $validated['booking_ids'])
            ->get()
            ->mapWithKeys(fn (Rating $rating) => [
                (string) $rating->booking_id => [
                    'id' => $rating->id,
                    'rating' => $rating->rating,
                    'comment' => $rating->comment,
                ],
            ])
            ->all();

        return response()->json(['ratings' => (object) $ratings]);
    }
}
