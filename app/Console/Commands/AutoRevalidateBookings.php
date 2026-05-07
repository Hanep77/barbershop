<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;

class AutoRevalidateBookings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:auto-revalidate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically cancel bookings that have exceeded the 15-minute no-show tolerance period';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            // Hanya proses booking dengan status confirmed
            // yang sudah melewati jadwal + 15 menit
            $bookings = Booking::where('status', 'confirmed')
                ->get();

            $processedCount = 0;
            $now = Carbon::now();

            foreach ($bookings as $booking) {
                // Gabungkan booking_date dan booking_time menjadi DateTime
                $bookingDateTime = Carbon::createFromFormat(
                    'Y-m-d H:i:s',
                    $booking->booking_date . ' ' . $this->normalizeTime($booking->booking_time)
                );

                // Hitung batas toleransi (15 menit setelah jadwal dimulai)
                $noShowDeadline = $bookingDateTime->copy()->addMinutes(15);

                // Jika waktu sekarang sudah lewat deadline no-show
                if ($now->greaterThan($noShowDeadline)) {
                    DB::beginTransaction();
                    try {
                        // Update booking menjadi no-show/cancelled
                        $booking->update([
                            'status' => 'cancelled',
                            'cancellation_reason' => 'No-show: Customer did not arrive within 15-minute tolerance',
                            'refund_amount' => 0,
                            'refund_status' => 'none',
                        ]);

                        // Kirim notifikasi ke customer dan barbershop
                        $booking->load(['user', 'barbershop.user', 'service']);
                        NotificationService::notifyNoShow($booking);

                        DB::commit();
                        $processedCount++;

                        Log::info('Booking marked as no-show', [
                            'booking_id' => $booking->id,
                            'scheduled_time' => $bookingDateTime->format('Y-m-d H:i:s'),
                            'no_show_deadline' => $noShowDeadline->format('Y-m-d H:i:s'),
                        ]);
                    } catch (\Exception $e) {
                        DB::rollBack();
                        Log::error('Error processing no-show booking', [
                            'booking_id' => $booking->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }

            $this->info("Processed {$processedCount} no-show bookings.");
            Log::info('Auto-revalidate completed', ['processed_count' => $processedCount]);
        } catch (\Exception $e) {
            Log::error('Auto-revalidate command failed', ['error' => $e->getMessage()]);
            $this->error('Error: ' . $e->getMessage());
        }
    }

    private function normalizeTime(string $time): string
    {
        return strlen($time) === 5 ? $time . ':00' : $time;
    }
}
