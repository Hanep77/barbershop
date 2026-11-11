<?php

namespace Database\Seeders;

use App\Models\Notification;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $notifications = [
            [
                'key' => 'notification.owner1.1',
                'user' => 'owner.1',
                'title' => 'Booking baru masuk',
                'message' => 'Budi Setiawan memesan Classic Haircut di The Gentleman\'s Cut.',
                'type' => 'booking_created',
                'is_read' => false,
                'hours_ago' => 2,
            ],
            [
                'key' => 'notification.owner1.2',
                'user' => 'owner.1',
                'title' => 'Pembayaran berhasil',
                'message' => 'Pembayaran booking #1 sebesar Rp50.000 telah diterima.',
                'type' => 'success',
                'is_read' => false,
                'hours_ago' => 26,
            ],
            [
                'key' => 'notification.owner1.3',
                'user' => 'owner.1',
                'title' => 'Review baru',
                'message' => 'Budi Setiawan memberi rating 5 untuk layanan Anda.',
                'type' => 'review',
                'is_read' => true,
                'hours_ago' => 50,
            ],
            [
                'key' => 'notification.customer1.1',
                'user' => 'customer.1',
                'title' => 'Booking dikonfirmasi',
                'message' => 'Booking Anda di The Gentleman\'s Cut sudah dikonfirmasi.',
                'type' => 'success',
                'is_read' => false,
                'hours_ago' => 4,
            ],
            [
                'key' => 'notification.customer1.2',
                'user' => 'customer.1',
                'title' => 'Pengingat jadwal',
                'message' => 'Jangan lupa, booking Anda dijadwalkan minggu ini.',
                'type' => 'booking_created',
                'is_read' => true,
                'hours_ago' => 30,
            ],
        ];

        foreach ($notifications as $definition) {
            $id = DemoFixtures::id($definition['key']);
            $createdAt = now()->subHours($definition['hours_ago']);

            /** @var Notification $notification */
            $notification = Notification::query()->find($id) ?? new Notification;

            $notification->forceFill([
                'id' => $id,
                'user_id' => DemoFixtures::id($definition['user']),
                'title' => $definition['title'],
                'message' => $definition['message'],
                'type' => $definition['type'],
                'is_read' => $definition['is_read'],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ])->save();
        }
    }
}
