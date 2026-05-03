<?php

namespace App\Http\Controllers;

use App\Models\Rating;
use App\Models\Barbershop;
use App\Models\Capster;
use App\Models\Booking;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RatingController extends Controller
{
    public function index(Barbershop $barbershop)
    {
        $ratings = Rating::with('user', 'capster')
            ->where('barbershop_id', $barbershop->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $ratings]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'barbershop_id' => 'required|exists:barbershops,id',
            'booking_id' => 'required|exists:bookings,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        $booking = Booking::where('id', $validated['booking_id'])
            ->where('user_id', $request->user()->id)
            ->where('status', 'completed')
            ->first();

        if (!$booking) {
            return response()->json(['message' => 'Review hanya dapat diberikan untuk pesanan yang sudah selesai.'], 400);
        }

        if (Rating::where('booking_id', $validated['booking_id'])->exists()) {
            return response()->json(['message' => 'Pesanan ini sudah pernah direview.'], 400);
        }

        DB::beginTransaction();
        try {
            $rating = Rating::create(array_merge($validated, [
                'user_id' => $request->user()->id,
                'capster_id' => $booking->capster_id,
            ]));

            // Update average ratings
            $this->updateAverages($validated['barbershop_id'], $booking->capster_id);

            // Notify barbershop
            $rating->load(['user', 'barbershop.user']);
            NotificationService::notifyNewReview($rating);

            DB::commit();

            return response()->json(['message' => 'Review berhasil dikirim!', 'data' => $rating], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mengirim review', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Rating $rating)
    {
        if ($rating->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $rating->update($validated);

            // Update average ratings
            $this->updateAverages($rating->barbershop_id, $rating->capster_id);

            DB::commit();

            return response()->json(['message' => 'Review berhasil diperbarui!', 'data' => $rating]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal memperbarui review', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, Rating $rating)
    {
        if ($rating->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $barbershopId = $rating->barbershop_id;
        $capsterId = $rating->capster_id;

        DB::beginTransaction();
        try {
            $rating->delete();

            // Update average ratings
            $this->updateAverages($barbershopId, $capsterId);

            DB::commit();

            return response()->json(['message' => 'Review berhasil dihapus!']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal menghapus review', 'error' => $e->getMessage()], 500);
        }
    }

    private function updateAverages($barbershopId, $capsterId)
    {
        // Update Barbershop Rating
        $avgBarbershop = Rating::where('barbershop_id', $barbershopId)->avg('rating') ?: 0;
        Barbershop::where('id', $barbershopId)->update(['rating' => $avgBarbershop]);

        // Update Capster Rating (using the same 'rating' field)
        if ($capsterId) {
            $avgCapster = Rating::where('capster_id', $capsterId)->avg('rating') ?: 0;
            Capster::where('id', $capsterId)->update(['rating' => $avgCapster]);
        }
    }
}
