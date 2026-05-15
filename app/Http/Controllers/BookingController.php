<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Barbershop;
use App\Models\Service;
use App\Models\Notification;
use App\Events\NotificationSent;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{

    public function show(Request $request, String $id)
    {
        $booking = Booking::with(['service', 'capster', 'barbershop', 'payment'])->findOrFail($id);

        $user = $request->user();
        $isOwner = $user && $booking->user_id === $user->id;
        $isBarbershopOwner = $user && $user->barbershop && $booking->barbershop_id === $user->barbershop->id;

        if (!$isOwner && !$isBarbershopOwner) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($booking);
    }

    public function getAvailableSlots(Request $request, Barbershop $barbershop)
    {
        $date = $request->query('date');
        $capsterId = $request->query('capster_id');
        $serviceId = $request->query('service_id');

        if (!$date || !$capsterId || !$serviceId) {
            return response()->json(['message' => 'Missing parameters'], 400);
        }

        $duration = Service::findOrFail($serviceId)->duration_minutes;
        $start = $this->dateTimeFromDateAndTime($date, $barbershop->getRawOriginal('open_time'));
        $end = $this->dateTimeFromDateAndTime($date, $barbershop->getRawOriginal('close_time'));

        $bookedSlots = Booking::where('capster_id', $capsterId)
            ->where('booking_date', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->with('service')
            ->get();

        $availableSlots = [];
        $current = $start->copy();
        $closingTime = $end->copy();
        $now = Carbon::now();

        while ($current->copy()->addMinutes($duration)->lessThanOrEqualTo($closingTime)) {
            $slotStart = $current->copy();
            $slotEnd = $current->copy()->addMinutes($duration);

            if ($slotStart->lessThan($now)) {
                $current->addMinutes(30); // Interval 30 menit
                continue;
            }

            $isBooked = $bookedSlots->contains(function ($booking) use ($slotStart, $slotEnd) {
                $bookingDate = $booking->getRawOriginal('booking_date');
                $bookingTime = $booking->getRawOriginal('booking_time');
                $bookingStart = $this->dateTimeFromDateAndTime($bookingDate, $bookingTime);
                $bookingEnd = $bookingStart->copy()->addMinutes($booking->service->duration_minutes);

                return $slotStart->lessThan($bookingEnd) && $slotEnd->greaterThan($bookingStart);
            });

            if (!$isBooked) {
                $availableSlots[] = $slotStart->format('H:i');
            }
            $current->addMinutes(30); // Interval 30 menit
        }

        return response()->json(['slots' => $availableSlots]);
    }

    public function index(Request $request)
    {
        $bookings = Booking::with(['barbershop', 'service', 'capster', 'rating'])
            ->where('user_id', $request->user()->id)
            ->orderBy('booking_date', 'desc')
            ->orderBy('booking_time', 'desc')
            ->get();

        return response()->json(['data' => $bookings]);
    }

    public function partnerIndex(Request $request)
    {
        $barbershop = $request->user()->barbershop;

        if (!$barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $bookings = Booking::with(['user', 'service', 'capster'])
            ->where('barbershop_id', $barbershop->id)
            ->orderBy('booking_date', 'desc')
            ->orderBy('booking_time', 'desc')
            ->get();

        return response()->json(['data' => $bookings]);
    }

    public function updateStatus(Request $request, Booking $booking)
    {
        $barbershop = $request->user()->barbershop;

        if (!$barbershop || $booking->barbershop_id !== $barbershop->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,completed,cancelled'
        ]);

        $booking->update($validated);

        // Notify customer about status change
        $booking->load(['user', 'barbershop', 'service']);
        NotificationService::notifyBookingStatusUpdated($booking);

        // Specific notification for completed status to encourage review
        if ($validated['status'] === 'completed') {
            NotificationService::send(
                $booking->user,
                'Layanan Selesai!',
                "Layanan Anda di {$booking->barbershop->name} telah selesai. Berikan ulasan Anda sekarang!",
                'booking_completed_review'
            );
        }

        return response()->json(['message' => 'Booking status updated successfully', 'booking' => $booking]);
    }

    public function store(Request $request)
    {
        try {
            // CRITICAL: Only customer role can create bookings
            if ($request->user()->role !== 'customer') {
                return response()->json([
                    'message' => 'Akun barbershop tidak dapat membuat reservasi.'
                ], 403);
            }

            $validated = $request->validate([
                'barbershop_id' => 'required|exists:barbershops,id',
                'service_id' => 'required|exists:services,id',
                'capster_id' => 'required|exists:capsters,id',
                'booking_date' => 'required|date',
                'booking_time' => 'required|date_format:H:i',
            ]);

            $bookingDateTime = $this->dateTimeFromDateAndTime($validated['booking_date'], $validated['booking_time']);

            if ($bookingDateTime->lessThan(Carbon::now())) {
                return response()->json(['message' => 'Tidak dapat booking jadwal yang sudah lewat.'], 422);
            }

            $booking = Booking::create(array_merge($validated, [
                'user_id' => $request->user()->id,
                'status' => 'pending'
            ]));

            // Load relations for notification
            $booking->load(['barbershop.user', 'user', 'service']);
            NotificationService::notifyNewBooking($booking);

            return response()->json(['message' => 'Booking created successfully', 'booking' => $booking], 201);
        } catch (\Exception $e) {
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                throw $e;
            }

            return response()->json(['message' => 'Error creating booking', 'error' => $e->getMessage()], 500);
        }
    }

    public function cancelBooking(Request $request, Booking $booking)
    {
        try {
            $booking->load('payment');
            
            Log::info('Attempting to cancel booking', [
                'booking_id' => $booking->id,
                'user_id' => $request->user()->id,
                'current_status' => $booking->status,
                'payment_status' => $booking->payment?->status
            ]);

            // 1. VALIDASI OWNERSHIP
            if ($booking->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // 2. VALIDASI STATUS BOOKING
            if (!in_array($booking->status, ['pending', 'confirmed'])) {
                return response()->json(['message' => 'Cannot cancel this booking'], 400);
            }

            // 3. HITUNG REFUND BERDASARKAN ATURAN WAKTU
            $bookingDateTime = $this->dateTimeFromDateAndTime($booking->booking_date, $booking->booking_time);
            $hoursDiff = now()->diffInHours($bookingDateTime, false);

            $refundAmount = 0;
            $payment = $booking->payment;

            // Refund hanya berlaku jika pembayaran sudah sukses (PAID)
            if ($payment && $payment->status === 'success') {
                if ($hoursDiff >= 2) {
                    // Refund 100% jika cancel >= 2 jam sebelum booking
                    $refundAmount = $payment->amount ?? 0;
                } else {
                    // Refund 0% jika cancel < 2 jam sebelum booking (hangus)
                    $refundAmount = 0;
                }
            }

            // 4. GUNAKAN DB TRANSACTION
            DB::beginTransaction();
            try {
                // 5. UPDATE BOOKING STATUS
                $bookingData = [
                    'status' => 'cancelled',
                    'refund_amount' => $refundAmount,
                    'cancellation_reason' => 'cancelled by customer',
                ];

                if ($refundAmount > 0) {
                    $bookingData['refund_status'] = 'pending';

                    // 6. REQUEST REFUND KE XENDIT
                    if ($payment && $payment->transaction_id) {
                        try {
                            $xenditService = new \App\Services\XenditService();
                            Log::info('Requesting Xendit refund', [
                                'booking_id' => $booking->id,
                                'invoice_id' => $payment->transaction_id,
                                'amount' => $refundAmount
                            ]);
                            
                            $refundResponse = $xenditService->refundInvoice(
                                $payment->transaction_id,
                                $refundAmount,
                                $payment->xendit_payment_id // Pass the payment_id for unified refund
                            );

                            if ($refundResponse && (isset($refundResponse['status']) || isset($refundResponse['id']))) {
                                Log::info('Xendit refund request accepted', ['response' => $refundResponse]);
                                $bookingData['refund_status'] = 'pending';
                            } else {
                                Log::warning('Xendit refund response invalid', ['response' => $refundResponse]);
                                $bookingData['refund_status'] = 'failed';
                            }
                        } catch (\Exception $refundError) {
                            $bookingData['refund_status'] = 'failed';
                            Log::error('Xendit refund exception', [
                                'booking_id' => $booking->id,
                                'error' => $refundError->getMessage()
                            ]);
                        }
                    }
                } else {
                    $bookingData['refund_status'] = ($payment && $payment->status === 'success') ? 'none' : 'none';
                }

                $booking->update($bookingData);

                // Notify both parties about cancellation
                $booking->load(['user', 'barbershop.user', 'service']);
                NotificationService::notifyCancellation($booking, 'customer');

                DB::commit();

                return response()->json([
                    'message' => 'Booking cancelled successfully',
                    'refund_amount' => $refundAmount,
                    'refund_status' => $bookingData['refund_status'],
                    'booking' => $booking->fresh(['payment'])
                ], 200);
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Internal cancellation error', ['error' => $e->getMessage()]);
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error cancelling booking', 'error' => $e->getMessage()], 500);
        }
    }

    public function cancelBookingByBarbershop(Request $request, Booking $booking)
    {
        try {
            // 1. VALIDASI OWNERSHIP - BARBERSHOP HARUS MILIK USER
            $barbershop = $request->user()->barbershop;
            if (!$barbershop || $booking->barbershop_id !== $barbershop->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // 2. VALIDASI STATUS BOOKING - HANYA PENDING/CONFIRMED YANG BISA DIBATALKAN
            if (!in_array($booking->status, ['pending', 'confirmed'])) {
                return response()->json(['message' => 'Cannot cancel this booking'], 400);
            }

            $booking->load('payment');
            $payment = $booking->payment;

            Log::info('Barbershop attempting to cancel booking', [
                'booking_id' => $booking->id,
                'barbershop_id' => $barbershop->id,
                'payment_status' => $payment?->status
            ]);

            // 3. BARBERSHOP CANCEL = 100% REFUND (jika sudah bayar)
            $refundAmount = 0;
            if ($payment && $payment->status === 'success') {
                $refundAmount = $payment->amount ?? 0;
            }

            // 4. GUNAKAN DB TRANSACTION
            DB::beginTransaction();
            try {
                // 5. UPDATE BOOKING STATUS
                $bookingData = [
                    'status' => 'cancelled',
                    'refund_amount' => $refundAmount,
                    'cancellation_reason' => 'cancelled by barbershop',
                ];

                if ($refundAmount > 0) {
                    $bookingData['refund_status'] = 'pending';

                    // 6. REQUEST REFUND KE XENDIT
                    if ($payment && $payment->transaction_id) {
                        try {
                            $xenditService = new \App\Services\XenditService();
                            Log::info('Requesting Xendit refund (Barbershop Cancel)', [
                                'invoice_id' => $payment->transaction_id,
                                'amount' => $refundAmount
                            ]);

                            $refundResponse = $xenditService->refundInvoice(
                                $payment->transaction_id,
                                $refundAmount,
                                $payment->xendit_payment_id // Pass the payment_id for unified refund
                            );

                            if ($refundResponse && (isset($refundResponse['status']) || isset($refundResponse['id']))) {
                                Log::info('Xendit refund request accepted', ['response' => $refundResponse]);
                                $bookingData['refund_status'] = 'pending';
                            } else {
                                Log::warning('Xendit refund response invalid', ['response' => $refundResponse]);
                                $bookingData['refund_status'] = 'failed';
                            }
                        } catch (\Exception $refundError) {
                            $bookingData['refund_status'] = 'failed';
                            Log::error('Refund request error for barbershop cancel', ['error' => $refundError->getMessage()]);
                        }
                    }
                } else {
                    $bookingData['refund_status'] = ($payment && $payment->status === 'success') ? 'none' : 'none';
                }

                $booking->update($bookingData);

                // Notify customer about cancellation by barbershop
                $booking->load(['user', 'barbershop.user', 'service']);
                NotificationService::notifyCancellationByBarbershop($booking);

                DB::commit();

                return response()->json([
                    'message' => 'Booking cancelled successfully',
                    'booking_status' => 'cancelled',
                    'refund_amount' => $refundAmount,
                    'refund_status' => $bookingData['refund_status']
                ], 200);
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Internal barbershop cancellation error', ['error' => $e->getMessage()]);
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error cancelling booking', 'error' => $e->getMessage()], 500);
        }
    }

    private function dateTimeFromDateAndTime($date, $time): Carbon
    {
        // Jika input adalah instance Carbon (karena casting), format dulu ke string yang benar
        $dateStr = $date instanceof \Carbon\Carbon ? $date->format('Y-m-d') : $date;
        $timeStr = $time instanceof \Carbon\Carbon ? $time->format('H:i:s') : $this->normalizeTime($time);
        
        return Carbon::createFromFormat('Y-m-d H:i:s', $dateStr . ' ' . $timeStr);
    }

    private function normalizeTime(string $time): string
    {
        return strlen($time) === 5 ? $time . ':00' : $time;
    }
}
