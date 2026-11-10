<?php

namespace App\Services;

use App\Events\NotificationSent;
use App\Models\Notification;

class NotificationService
{
    /**
     * Identity owns all notification writes. Other services publish domain
     * events; they never touch this database.
     */
    public static function send(string $userId, string $title, string $message, string $type): Notification
    {
        $notification = Notification::query()->create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'is_read' => false,
        ]);

        event(new NotificationSent($notification));

        return $notification;
    }
}
