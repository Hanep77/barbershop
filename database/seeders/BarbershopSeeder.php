<?php

namespace Database\Seeders;

use App\Models\Barbershop;
use App\Models\Capster;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BarbershopSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. The Gentleman's Cut
        $user1 = User::create([
            'name' => 'John Owner',
            'email' => 'john@gentleman.com',
            'password' => Hash::make('password'),
            'role' => 'barbershop',
        ]);

        $shop1 = Barbershop::create([
            'user_id' => $user1->id,
            'name' => "The Gentleman's Cut",
            'address' => 'Jl. Sudirman No. 123, Jakarta',
            'map_url' => 'https://goo.gl/maps/example1',
            'phone_number' => '081234567890',
            'description' => 'A classic barbershop experience for the modern gentleman.',
            'latitude' => '-6.2088',
            'longitude' => '106.8456',
        ]);

        $haircutCat1 = ServiceCategory::create(['name' => 'Haircut', 'barbershop_id' => $shop1->id]);
        $shavingCat1 = ServiceCategory::create(['name' => 'Shaving & Beard', 'barbershop_id' => $shop1->id]);

        // Services for Shop 1
        Service::create([
            'barbershop_id' => $shop1->id,
            'category_id' => $haircutCat1->id,
            'name' => 'Classic Haircut',
            'description' => 'Precision cut with scissors and clippers.',
            'price' => 50000,
            'duration_minutes' => 45,
        ]);

        Service::create([
            'barbershop_id' => $shop1->id,
            'category_id' => $shavingCat1->id,
            'name' => 'Hot Towel Shave',
            'description' => 'Traditional straight razor shave with hot towels.',
            'price' => 35000,
            'duration_minutes' => 30,
        ]);

        // Capsters for Shop 1
        Capster::create([
            'barbershop_id' => $shop1->id,
            'name' => 'Marcus Chen',
            'title' => 'Master Barber',
            'experience' => '10 years',
            'rating' => 4.9,
            'specialties' => ['Fade', 'Classic Cut', 'Beard Grooming'],
            'phone' => '081234567891',
            'bio' => 'Marcus is a master of the traditional straight razor shave and classic pompadours.',
            'image' => 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop',
        ]);

        Capster::create([
            'barbershop_id' => $shop1->id,
            'name' => 'David Wilson',
            'title' => 'Senior Barber',
            'experience' => '5 years',
            'rating' => 4.7,
            'specialties' => ['Taper', 'Scissor Cut'],
            'phone' => '081234567892',
            'bio' => 'David specializes in modern styles and precision scissor work.',
            'image' => 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1974&auto=format&fit=crop',
        ]);

        // 2. Modern Edge Barbers
        $user2 = User::create([
            'name' => 'Sarah Smith',
            'email' => 'sarah@modernedge.com',
            'password' => Hash::make('password'),
            'role' => 'barbershop',
        ]);

        $shop2 = Barbershop::create([
            'user_id' => $user2->id,
            'name' => 'Modern Edge Barbers',
            'address' => 'Jl. Thamrin No. 45, Jakarta',
            'map_url' => 'https://goo.gl/maps/example2',
            'phone_number' => '082234567890',
            'description' => 'Trendy styles and contemporary grooming services.',
            'latitude' => '-6.1751',
            'longitude' => '106.8272',
        ]);

        $haircutCat2 = ServiceCategory::create(['name' => 'Haircut', 'barbershop_id' => $shop2->id]);
        $treatmentCat2 = ServiceCategory::create(['name' => 'Treatment', 'barbershop_id' => $shop2->id]);

        Service::create([
            'barbershop_id' => $shop2->id,
            'category_id' => $haircutCat2->id,
            'name' => 'Skin Fade',
            'description' => 'Modern skin fade with styling.',
            'price' => 65000,
            'duration_minutes' => 60,
        ]);

        Service::create([
            'barbershop_id' => $shop2->id,
            'category_id' => $treatmentCat2->id,
            'name' => 'Hair Spa',
            'description' => 'Refreshing hair and scalp treatment.',
            'price' => 80000,
            'duration_minutes' => 45,
        ]);

        Capster::create([
            'barbershop_id' => $shop2->id,
            'name' => 'Alex Rivera',
            'title' => 'Creative Director',
            'experience' => '7 years',
            'rating' => 4.8,
            'specialties' => ['Skin Fade', 'Hair Art', 'Coloring'],
            'phone' => '082234567891',
            'bio' => 'Alex is known for his creative approach to modern fades and hair designs.',
            'image' => 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1974&auto=format&fit=crop',
        ]);

        // 3. Vintage Style Studio
        $user3 = User::create([
            'name' => 'Mike Miller',
            'email' => 'mike@vintage.com',
            'password' => Hash::make('password'),
            'role' => 'barbershop',
        ]);

        $shop3 = Barbershop::create([
            'user_id' => $user3->id,
            'name' => 'Vintage Style Studio',
            'address' => 'Jl. Kemang Raya No. 10, Jakarta',
            'map_url' => 'https://goo.gl/maps/example3',
            'phone_number' => '083234567890',
            'description' => 'Old school vibes with premium modern results.',
            'latitude' => '-6.2733',
            'longitude' => '106.8208',
        ]);

        $haircutCat3 = ServiceCategory::create(['name' => 'Haircut', 'barbershop_id' => $shop3->id]);

        Service::create([
            'barbershop_id' => $shop3->id,
            'category_id' => $haircutCat3->id,
            'name' => 'Buzz Cut',
            'description' => 'Clean and simple all-over clipper cut.',
            'price' => 40000,
            'duration_minutes' => 20,
        ]);

        Capster::create([
            'barbershop_id' => $shop3->id,
            'name' => 'Leo Thompson',
            'title' => 'Senior Barber',
            'experience' => '12 years',
            'rating' => 5.0,
            'specialties' => ['Vintage Styles', 'Pompadour', 'Flat Top'],
            'phone' => '083234567891',
            'bio' => 'Leo is a veteran in the industry, specializing in time-tested vintage styles.',
            'image' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop',
        ]);
    }
}
