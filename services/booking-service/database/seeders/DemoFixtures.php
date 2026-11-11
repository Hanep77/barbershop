<?php

namespace Database\Seeders;

use Ramsey\Uuid\Uuid;

/**
 * Deterministic demo data shared by the identity, catalog, booking and
 * payment seeders.
 *
 * Identifiers are derived with UUIDv5 from stable keys, so the same user,
 * barbershop, service, capster or booking has the same id in every service
 * database. The four copies of this file MUST stay byte-identical:
 *
 *   services/{identity,catalog,booking,payment}-service/database/seeders/DemoFixtures.php
 */
final class DemoFixtures
{
    /** Password for every seeded account. */
    public const PASSWORD = 'password';

    /** Number of seeded bookings; ids are 1..BOOKING_COUNT. */
    public const BOOKING_COUNT = 36;

    public static function id(string $key): string
    {
        return (string) Uuid::uuid5(Uuid::NAMESPACE_DNS, 'barberbrody.demo.'.$key);
    }

    /**
     * @return array<int, array{key: string, name: string, email: string, role: string}>
     */
    public static function users(): array
    {
        return [
            ['key' => 'owner.1', 'name' => 'Admin Barbershop', 'email' => 'admin@barbershop.com', 'role' => 'barbershop'],
            ['key' => 'owner.2', 'name' => 'Rangga Pratama', 'email' => 'rangga@barbershop.com', 'role' => 'barbershop'],
            ['key' => 'owner.3', 'name' => 'Dewi Lestari', 'email' => 'dewi@barbershop.com', 'role' => 'barbershop'],
            ['key' => 'owner.4', 'name' => 'Bagus Santoso', 'email' => 'bagus@barbershop.com', 'role' => 'barbershop'],
            ['key' => 'owner.5', 'name' => 'Siti Rahma', 'email' => 'siti@barbershop.com', 'role' => 'barbershop'],
            ['key' => 'owner.6', 'name' => 'Andi Wijaya', 'email' => 'andi@barbershop.com', 'role' => 'barbershop'],
            ['key' => 'customer.1', 'name' => 'Budi Setiawan', 'email' => 'budi@example.com', 'role' => 'customer'],
            ['key' => 'customer.2', 'name' => 'Rina Marlina', 'email' => 'rina@example.com', 'role' => 'customer'],
            ['key' => 'customer.3', 'name' => 'Fajar Nugroho', 'email' => 'fajar@example.com', 'role' => 'customer'],
            ['key' => 'customer.4', 'name' => 'Ayu Permata', 'email' => 'ayu@example.com', 'role' => 'customer'],
            ['key' => 'customer.5', 'name' => 'Dimas Saputra', 'email' => 'dimas@example.com', 'role' => 'customer'],
            ['key' => 'customer.6', 'name' => 'Nabila Putri', 'email' => 'nabila@example.com', 'role' => 'customer'],
            ['key' => 'customer.7', 'name' => 'Yoga Aditya', 'email' => 'yoga@example.com', 'role' => 'customer'],
            ['key' => 'customer.8', 'name' => 'Clara Tan', 'email' => 'clara@example.com', 'role' => 'customer'],
        ];
    }

    /**
     * @return array<int, array{key: string, name: string, email: string, role: string}>
     */
    public static function owners(): array
    {
        return array_values(array_filter(
            self::users(),
            static fn (array $user): bool => $user['role'] === 'barbershop',
        ));
    }

    /**
     * @return array<int, array{key: string, name: string, email: string, role: string}>
     */
    public static function customers(): array
    {
        return array_values(array_filter(
            self::users(),
            static fn (array $user): bool => $user['role'] === 'customer',
        ));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function shops(): array
    {
        return [
            [
                'key' => 'shop.1',
                'owner' => 'owner.1',
                'name' => "The Gentleman's Cut",
                'address' => 'Jl. Sudirman No. 123, Jakarta',
                'map_url' => 'https://maps.google.com/?q=-6.2088,106.8456',
                'phone_number' => '081234567890',
                'description' => 'A classic barbershop experience for the modern gentleman.',
                'latitude' => '-6.2088',
                'longitude' => '106.8456',
                'open_time' => '09:00',
                'close_time' => '21:00',
                'images' => [
                    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop',
                ],
                'categories' => [
                    ['key' => 'category.shop1.haircut', 'name' => 'Haircut'],
                    ['key' => 'category.shop1.shaving', 'name' => 'Shaving & Beard'],
                ],
                'services' => [
                    ['key' => 'service.shop1.classic', 'category' => 'category.shop1.haircut', 'name' => 'Classic Haircut', 'description' => 'Precision cut with scissors and clippers.', 'price' => 50000, 'duration' => 45],
                    ['key' => 'service.shop1.wash', 'category' => 'category.shop1.haircut', 'name' => 'Haircut + Wash', 'description' => 'Haircut with professional shampoo.', 'price' => 75000, 'duration' => 60],
                    ['key' => 'service.shop1.shave', 'category' => 'category.shop1.shaving', 'name' => 'Hot Towel Shave', 'description' => 'Traditional straight razor shave.', 'price' => 35000, 'duration' => 30],
                    ['key' => 'service.shop1.beard', 'category' => 'category.shop1.shaving', 'name' => 'Beard Trim', 'description' => 'Professional beard shaping.', 'price' => 25000, 'duration' => 20],
                ],
                'capsters' => [
                    ['key' => 'capster.marcus', 'name' => 'Marcus Chen', 'title' => 'Master Barber', 'experience' => '10 years', 'rating' => 4.9, 'specialties' => ['Fade', 'Classic Cut'], 'phone' => '081234567891', 'bio' => 'Master of traditional shaving.'],
                    ['key' => 'capster.david', 'name' => 'David Wilson', 'title' => 'Senior Barber', 'experience' => '5 years', 'rating' => 4.7, 'specialties' => ['Taper', 'Scissor Cut'], 'phone' => '081234567892', 'bio' => 'Specializes in modern styles.'],
                ],
            ],
            [
                'key' => 'shop.2',
                'owner' => 'owner.2',
                'name' => 'Modern Edge Barbers',
                'address' => 'Jl. Thamrin No. 45, Jakarta',
                'map_url' => 'https://maps.google.com/?q=-6.1944,106.8227',
                'phone_number' => '082234567890',
                'description' => 'Trendy styles and contemporary grooming services.',
                'latitude' => '-6.1944',
                'longitude' => '106.8227',
                'open_time' => '08:00',
                'close_time' => '20:00',
                'images' => [
                    'https://images.unsplash.com/photo-1521490683712-35a1cb235d1c?q=80&w=1200&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1200&auto=format&fit=crop',
                ],
                'categories' => [
                    ['key' => 'category.shop2.haircut', 'name' => 'Haircut'],
                    ['key' => 'category.shop2.coloring', 'name' => 'Hair Coloring'],
                ],
                'services' => [
                    ['key' => 'service.shop2.modern', 'category' => 'category.shop2.haircut', 'name' => 'Modern Haircut', 'description' => 'Contemporary styling.', 'price' => 60000, 'duration' => 50],
                    ['key' => 'service.shop2.coloring', 'category' => 'category.shop2.coloring', 'name' => 'Hair Coloring', 'description' => 'Professional coloring.', 'price' => 150000, 'duration' => 120],
                ],
                'capsters' => [
                    ['key' => 'capster.alex', 'name' => 'Alex Rodriguez', 'title' => 'Barber', 'experience' => '3 years', 'rating' => 4.5, 'specialties' => ['Kids Haircut', 'Coloring'], 'phone' => '081234567893', 'bio' => 'Loves working with kids.'],
                ],
            ],
            [
                'key' => 'shop.3',
                'owner' => 'owner.3',
                'name' => 'Urban Groom Barbershop',
                'address' => 'Jl. Gatot Subroto No. 78, Jakarta',
                'map_url' => 'https://maps.google.com/?q=-6.2244,106.8087',
                'phone_number' => '083334567890',
                'description' => 'Urban grooming for the busy professional.',
                'latitude' => '-6.2244',
                'longitude' => '106.8087',
                'open_time' => '10:00',
                'close_time' => '22:00',
                'images' => [
                    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1200&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?q=80&w=1200&auto=format&fit=crop',
                ],
                'categories' => [
                    ['key' => 'category.shop3.haircut', 'name' => 'Haircut'],
                    ['key' => 'category.shop3.styling', 'name' => 'Hair Styling'],
                ],
                'services' => [
                    ['key' => 'service.shop3.urban', 'category' => 'category.shop3.haircut', 'name' => 'Urban Haircut', 'description' => 'Modern urban style.', 'price' => 55000, 'duration' => 45],
                    ['key' => 'service.shop3.styling', 'category' => 'category.shop3.styling', 'name' => 'Hair Styling', 'description' => 'Professional styling.', 'price' => 100000, 'duration' => 60],
                ],
                'capsters' => [
                    ['key' => 'capster.sarah', 'name' => 'Sarah Johnson', 'title' => 'Stylist', 'experience' => '7 years', 'rating' => 4.8, 'specialties' => ['Styling', 'Treatment'], 'phone' => '081234567894', 'bio' => 'Expert in styling.'],
                ],
            ],
            [
                'key' => 'shop.4',
                'owner' => 'owner.4',
                'name' => 'Classic Cuts & Shaves',
                'address' => 'Jl. MH Thamrin No. 101, Jakarta',
                'map_url' => 'https://maps.google.com/?q=-6.1924,106.8217',
                'phone_number' => '084434567890',
                'description' => 'Traditional barbering with a modern twist.',
                'latitude' => '-6.1924',
                'longitude' => '106.8217',
                'open_time' => '09:30',
                'close_time' => '20:30',
                'images' => [
                    'https://images.unsplash.com/photo-1593702288056-7927b442d0fa?q=80&w=1200&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=1200&auto=format&fit=crop',
                ],
                'categories' => [
                    ['key' => 'category.shop4.haircut', 'name' => 'Haircut'],
                    ['key' => 'category.shop4.shaving', 'name' => 'Shaving & Beard'],
                ],
                'services' => [
                    ['key' => 'service.shop4.classic', 'category' => 'category.shop4.haircut', 'name' => 'Classic Cut', 'description' => 'Traditional cut.', 'price' => 50000, 'duration' => 45],
                    ['key' => 'service.shop4.shave', 'category' => 'category.shop4.shaving', 'name' => 'Traditional Shave', 'description' => 'Classic shave.', 'price' => 40000, 'duration' => 35],
                ],
                'capsters' => [
                    ['key' => 'capster.mike', 'name' => 'Mike Thompson', 'title' => 'Apprentice', 'experience' => '1 year', 'rating' => 4.2, 'specialties' => ['Basic Haircut'], 'phone' => '081234567895', 'bio' => 'Learning the art.'],
                ],
            ],
            [
                'key' => 'shop.5',
                'owner' => 'owner.5',
                'name' => 'Elite Barbers Lounge',
                'address' => 'Jl. Sudirman No. 200, Jakarta',
                'map_url' => 'https://maps.google.com/?q=-6.2080,106.8450',
                'phone_number' => '085534567890',
                'description' => 'Premium grooming experience in a luxurious setting.',
                'latitude' => '-6.2080',
                'longitude' => '106.8450',
                'open_time' => '11:00',
                'close_time' => '23:00',
                'images' => [
                    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1200&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1519500099198-fd81846b8f03?q=80&w=1200&auto=format&fit=crop',
                ],
                'categories' => [
                    ['key' => 'category.shop5.haircut', 'name' => 'Haircut'],
                    ['key' => 'category.shop5.styling', 'name' => 'Hair Styling'],
                ],
                'services' => [
                    ['key' => 'service.shop5.premium', 'category' => 'category.shop5.haircut', 'name' => 'Premium Haircut', 'description' => 'Luxury cut.', 'price' => 80000, 'duration' => 60],
                    ['key' => 'service.shop5.luxury', 'category' => 'category.shop5.styling', 'name' => 'Luxury Styling', 'description' => 'High-end styling.', 'price' => 120000, 'duration' => 70],
                ],
                'capsters' => [
                    ['key' => 'capster.emma', 'name' => 'Emma Davis', 'title' => 'Master Stylist', 'experience' => '8 years', 'rating' => 4.9, 'specialties' => ['Luxury Cuts', 'Styling'], 'phone' => '081234567896', 'bio' => 'Luxury specialist.'],
                ],
            ],
            [
                'key' => 'shop.6',
                'owner' => 'owner.6',
                'name' => 'Street Style Barbers',
                'address' => 'Jl. Malioboro No. 50, Yogyakarta',
                'map_url' => 'https://maps.google.com/?q=-7.7956,110.3695',
                'phone_number' => '086634567890',
                'description' => 'Street-inspired cuts for the urban crowd.',
                'latitude' => '-7.7956',
                'longitude' => '110.3695',
                'open_time' => '08:00',
                'close_time' => '21:00',
                'images' => [
                    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop',
                ],
                'categories' => [
                    ['key' => 'category.shop6.haircut', 'name' => 'Haircut'],
                    ['key' => 'category.shop6.kids', 'name' => 'Kids Haircut'],
                ],
                'services' => [
                    ['key' => 'service.shop6.street', 'category' => 'category.shop6.haircut', 'name' => 'Street Cut', 'description' => 'Urban street style.', 'price' => 45000, 'duration' => 40],
                    ['key' => 'service.shop6.kids', 'category' => 'category.shop6.kids', 'name' => 'Kids Cut', 'description' => 'Fun cuts for kids.', 'price' => 30000, 'duration' => 30],
                ],
                'capsters' => [
                    ['key' => 'capster.jake', 'name' => 'Jake Miller', 'title' => 'Street Barber', 'experience' => '4 years', 'rating' => 4.6, 'specialties' => ['Street Styles', 'Kids'], 'phone' => '081234567897', 'bio' => 'Street style expert.'],
                ],
            ],
        ];
    }

    /**
     * The demo booking plan. Every service derives the same rows from this
     * method, including the fixed bigint booking ids, so catalog ratings and
     * payment rows can reference them without a cross-service query.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function bookings(): array
    {
        static $bookings;

        if (is_array($bookings)) {
            return $bookings;
        }

        $shops = self::shops();
        $customers = self::customers();
        $shopCount = count($shops);
        $statuses = ['completed', 'completed', 'completed', 'confirmed', 'pending', 'cancelled'];
        $slotOffsets = [0, 60, 90, 120, 150];
        $ratings = [5, 4, 5, 3, 5, 4, 5];
        $today = now()->startOfDay();

        $bookings = [];

        for ($id = 1; $id <= self::BOOKING_COUNT; $id++) {
            $index = $id - 1;
            $shopIndex = $index % $shopCount;
            $round = intdiv($index, $shopCount);

            $shop = $shops[$shopIndex];
            $service = $shop['services'][$round % count($shop['services'])];
            $capster = $shop['capsters'][$round % count($shop['capsters'])];
            $customer = $customers[$index % count($customers)];
            $status = $statuses[$round % count($statuses)];

            $isPast = in_array($status, ['completed', 'cancelled'], true);
            $date = $isPast
                ? $today->copy()->subDays(2 + ($id % 45))
                : $today->copy()->addDays(1 + ($id % 12));

            [$openHour, $openMinute] = array_map('intval', explode(':', $shop['open_time']));
            $minutes = ($openHour * 60) + $openMinute + $slotOffsets[$id % count($slotOffsets)];
            $time = sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);

            $createdAt = $isPast
                ? $date->copy()->subDays(2)->setTime(9, 0)
                : now()->subDays($id % 20)->setTime(9, 0);

            $rating = null;
            $comment = null;

            if ($status === 'completed' && $id % 5 !== 0) {
                $rating = $ratings[$id % count($ratings)];
                $comment = self::commentFor($rating, $id);
            }

            $bookings[] = [
                'id' => $id,
                'shop_id' => self::id($shop['key']),
                'shop_key' => $shop['key'],
                'shop_name' => $shop['name'],
                'owner_id' => self::id($shop['owner']),
                'service_id' => self::id($service['key']),
                'service_name' => $service['name'],
                'service_price' => (float) $service['price'],
                'service_duration' => (int) $service['duration'],
                'capster_id' => self::id($capster['key']),
                'capster_name' => $capster['name'],
                'user_id' => self::id($customer['key']),
                'user_name' => $customer['name'],
                'user_email' => $customer['email'],
                'status' => $status,
                'booking_date' => $date->toDateString(),
                'booking_time' => $time,
                'created_at' => $createdAt->toDateTimeString(),
                'payment_status' => $status === 'pending' ? 'pending' : 'success',
                'refunded' => $status === 'cancelled',
                'rating' => $rating,
                'comment' => $comment,
            ];
        }

        return $bookings;
    }

    /**
     * Demo payouts for the first barbershop (owner.1 / admin@barbershop.com).
     *
     * @return array<int, array<string, mixed>>
     */
    public static function withdrawals(): array
    {
        return [
            [
                'external_id' => 'withdrawal-demo-1',
                'amount' => 75000,
                'status' => 'success',
                'bank_name' => 'BCA',
                'account_name' => 'Admin Barbershop',
                'account_number' => '1234567890',
                'xendit_disbursement_id' => 'demo-disbursement-1',
                'xendit_status' => 'SUCCEEDED',
                'processed_at' => now()->subDays(10),
            ],
            [
                'external_id' => 'withdrawal-demo-2',
                'amount' => 50000,
                'status' => 'pending',
                'bank_name' => 'MANDIRI',
                'account_name' => 'Admin Barbershop',
                'account_number' => '0987654321',
                'xendit_disbursement_id' => 'demo-disbursement-2',
                'xendit_status' => 'PENDING',
                'processed_at' => null,
            ],
        ];
    }

    private static function commentFor(int $rating, int $id): string
    {
        $comments = [
            5 => [
                'Pelayanan sangat memuaskan!',
                'Hasil potongan rapi dan sesuai permintaan.',
                'Barber-nya ramah dan profesional.',
            ],
            4 => [
                'Bagus, hanya sedikit menunggu.',
                'Hasilnya memuaskan, akan kembali lagi.',
                'Tempatnya nyaman dan bersih.',
            ],
            3 => [
                'Cukup baik, tapi bisa lebih cepat.',
                'Hasil oke, antrean agak lama.',
            ],
        ];

        $options = $comments[$rating] ?? $comments[3];

        return $options[$id % count($options)];
    }
}
