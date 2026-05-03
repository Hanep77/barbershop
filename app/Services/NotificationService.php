<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Events\NotificationSent;

class NotificationService
{
    /**
     * Send a notification to a user.
     *
     * @param User $user
     * @param string $title
     * @param string $message
     * @param string $type
     * @return Notification
     */
    public static function send(User $user, string $title, string $message, string $type): Notification
    {
        $notification = Notification::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'is_read' => false,
        ]);

        event(new NotificationSent($notification));

        return $notification;
    }

    /**
     * Send notification for new booking to barbershop owner.
     */
    public static function notifyNewBooking($booking)
    {
        $barbershop = $booking->barbershop;
        $owner = $barbershop->user;

        if ($owner) {
            $date = \Carbon\Carbon::parse($booking->booking_date)->format('d M Y');
            $time = \Carbon\Carbon::parse($booking->booking_time)->format('H:i');
            
            self::send(
                $owner,
                'New Booking Alert!',
                "New booking from {$booking->user->name} for {$booking->service->name} on {$date} at {$time}.",
                'booking_created'
            );
        }
    }

    /**
     * Send notification for booking status update to customer.
     */
    public static function notifyBookingStatusUpdated($booking)
    {
        $user = $booking->user;
        $status = ucfirst($booking->status);
        
        self::send(
            $user,
            "Booking {$status}",
            "Your booking for {$booking->service->name} at {$booking->barbershop->name} is now {$booking->status}.",
            "booking_{$booking->status}"
        );
    }

    /**
     * Send notification for payment status to customer.
     */
    public static function notifyPaymentStatus($payment, $status)
    {
        $booking = $payment->booking;
        $user = $booking->user;

        if ($status === 'success') {
            self::send(
                $user,
                'Payment Successful',
                "Payment for your booking at {$booking->barbershop->name} has been confirmed.",
                'payment_success'
            );
        } elseif ($status === 'failed') {
            self::send(
                $user,
                'Payment Failed',
                "Payment for your booking at {$booking->barbershop->name} failed or expired.",
                'payment_failed'
            );
        }
    }

    /**
     * Send notification for cancellation to both parties.
     */
    public static function notifyCancellation($booking, $cancelledBy)
    {
        $customer = $booking->user;
        $owner = $booking->barbershop->user;
        $date = \Carbon\Carbon::parse($booking->booking_date)->format('d M Y');

        // Notify customer
        self::send(
            $customer,
            'Booking Cancelled',
            "Your booking at {$booking->barbershop->name} on {$date} has been cancelled.",
            'booking_cancelled'
        );

        // Notify owner
        if ($owner) {
            self::send(
                $owner,
                'Booking Cancelled',
                "Booking from {$customer->name} on {$date} has been cancelled.",
                'booking_cancelled'
            );
        }
    }
}
