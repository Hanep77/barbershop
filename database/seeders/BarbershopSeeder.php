<?php

namespace Database\Seeders;

use App\Models\Barbershop;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\Capster;

class BarbershopSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $barbershopUsers = User::where('role', 'barbershop')->get();

        // 1. The Gentleman's Cut
        if (isset($barbershopUsers[0])) {
            $shop1 = Barbershop::create([
                'user_id' => $barbershopUsers[0]->id,
                'name' => "The Gentleman's Cut",
                'address' => 'Jl. Sudirman No. 123, Jakarta',
                'map_url' => 'https://goo.gl/maps/example1',
                'phone_number' => '081234567890',
                'description' => 'A classic barbershop experience for the modern gentleman.',
                'latitude' => '-6.2088',
                'longitude' => '106.8456',
                'open_time' => '09:00',
                'close_time' => '21:00',
            ]);

            $haircutCat1 = ServiceCategory::create(['name' => 'Haircut', 'barbershop_id' => $shop1->id]);
            $shavingCat1 = ServiceCategory::create(['name' => 'Shaving & Beard', 'barbershop_id' => $shop1->id]);

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
                'category_id' => $haircutCat1->id,
                'name' => 'Haircut + Wash',
                'description' => 'Haircut with professional shampoo.',
                'price' => 75000,
                'duration_minutes' => 60,
            ]);
            Service::create([
                'barbershop_id' => $shop1->id,
                'category_id' => $shavingCat1->id,
                'name' => 'Hot Towel Shave',
                'description' => 'Traditional straight razor shave.',
                'price' => 35000,
                'duration_minutes' => 30,
            ]);
            Service::create([
                'barbershop_id' => $shop1->id,
                'category_id' => $shavingCat1->id,
                'name' => 'Beard Trim',
                'description' => 'Professional beard shaping.',
                'price' => 25000,
                'duration_minutes' => 20,
            ]);

            Capster::create([
                'barbershop_id' => $shop1->id,
                'name' => 'Marcus Chen',
                'title' => 'Master Barber',
                'experience' => '10 years',
                'rating' => 4.9,
                'specialties' => json_encode(['Fade', 'Classic Cut']),
                'phone' => '081234567891',
                'bio' => 'Master of traditional shaving.',
                'is_available' => true,
            ]);
            Capster::create([
                'barbershop_id' => $shop1->id,
                'name' => 'David Wilson',
                'title' => 'Senior Barber',
                'experience' => '5 years',
                'rating' => 4.7,
                'specialties' => json_encode(['Taper', 'Scissor Cut']),
                'phone' => '081234567892',
                'bio' => 'Specializes in modern styles.',
                'is_available' => true,
            ]);
        }

        // 2. Modern Edge Barbers
        if (isset($barbershopUsers[1])) {
            $shop2 = Barbershop::create([
                'user_id' => $barbershopUsers[1]->id,
                'name' => 'Modern Edge Barbers',
                'address' => 'Jl. Thamrin No. 45, Jakarta',
                'map_url' => 'https://goo.gl/maps/example2',
                'phone_number' => '082234567890',
                'description' => 'Trendy styles and contemporary grooming services.',
                'latitude' => '-6.1944',
                'longitude' => '106.8227',
                'open_time' => '08:00',
                'close_time' => '20:00',
            ]);

            $haircutCat2 = ServiceCategory::create(['name' => 'Haircut', 'barbershop_id' => $shop2->id]);
            $coloringCat2 = ServiceCategory::create(['name' => 'Hair Coloring', 'barbershop_id' => $shop2->id]);

            Service::create([
                'barbershop_id' => $shop2->id,
                'category_id' => $haircutCat2->id,
                'name' => 'Modern Haircut',
                'description' => 'Contemporary styling.',
                'price' => 60000,
                'duration_minutes' => 50,
            ]);
            Service::create([
                'barbershop_id' => $shop2->id,
                'category_id' => $coloringCat2->id,
                'name' => 'Hair Coloring',
                'description' => 'Professional coloring.',
                'price' => 150000,
                'duration_minutes' => 120,
            ]);

            Capster::create([
                'barbershop_id' => $shop2->id,
                'name' => 'Alex Rodriguez',
                'title' => 'Barber',
                'experience' => '3 years',
                'rating' => 4.5,
                'specialties' => json_encode(['Kids Haircut', 'Coloring']),
                'phone' => '081234567893',
                'bio' => 'Loves working with kids.',
                'is_available' => true,
            ]);
        }

        // 3. Urban Groom Barbershop
        if (isset($barbershopUsers[2])) {
            $shop3 = Barbershop::create([
                'user_id' => $barbershopUsers[2]->id,
                'name' => 'Urban Groom Barbershop',
                'address' => 'Jl. Gatot Subroto No. 78, Jakarta',
                'map_url' => 'https://goo.gl/maps/example3',
                'phone_number' => '083334567890',
                'description' => 'Urban grooming for the busy professional.',
                'latitude' => '-6.2244',
                'longitude' => '106.8087',
                'open_time' => '10:00',
                'close_time' => '22:00',
            ]);

            $haircutCat3 = ServiceCategory::create(['name' => 'Haircut', 'barbershop_id' => $shop3->id]);
            $stylingCat3 = ServiceCategory::create(['name' => 'Hair Styling', 'barbershop_id' => $shop3->id]);

            Service::create([
                'barbershop_id' => $shop3->id,
                'category_id' => $haircutCat3->id,
                'name' => 'Urban Haircut',
                'description' => 'Modern urban style.',
                'price' => 55000,
                'duration_minutes' => 45,
            ]);
            Service::create([
                'barbershop_id' => $shop3->id,
                'category_id' => $stylingCat3->id,
                'name' => 'Hair Styling',
                'description' => 'Professional styling.',
                'price' => 100000,
                'duration_minutes' => 60,
            ]);

            Capster::create([
                'barbershop_id' => $shop3->id,
                'name' => 'Sarah Johnson',
                'title' => 'Stylist',
                'experience' => '7 years',
                'rating' => 4.8,
                'specialties' => json_encode(['Styling', 'Treatment']),
                'phone' => '081234567894',
                'bio' => 'Expert in styling.',
                'is_available' => true,
            ]);
        }

        // 4. Classic Cuts & Shaves
        if (isset($barbershopUsers[3])) {
            $shop4 = Barbershop::create([
                'user_id' => $barbershopUsers[3]->id,
                'name' => 'Classic Cuts & Shaves',
                'address' => 'Jl. MH Thamrin No. 101, Jakarta',
                'map_url' => 'https://goo.gl/maps/example4',
                'phone_number' => '084434567890',
                'description' => 'Traditional barbering with a modern twist.',
                'latitude' => '-6.1924',
                'longitude' => '106.8217',
                'open_time' => '09:30',
                'close_time' => '20:30',
            ]);

            $haircutCat4 = ServiceCategory::create(['name' => 'Haircut', 'barbershop_id' => $shop4->id]);
            $shavingCat4 = ServiceCategory::create(['name' => 'Shaving & Beard', 'barbershop_id' => $shop4->id]);

            Service::create([
                'barbershop_id' => $shop4->id,
                'category_id' => $haircutCat4->id,
                'name' => 'Classic Cut',
                'description' => 'Traditional cut.',
                'price' => 50000,
                'duration_minutes' => 45,
            ]);
            Service::create([
                'barbershop_id' => $shop4->id,
                'category_id' => $shavingCat4->id,
                'name' => 'Traditional Shave',
                'description' => 'Classic shave.',
                'price' => 40000,
                'duration_minutes' => 35,
            ]);

            Capster::create([
                'barbershop_id' => $shop4->id,
                'name' => 'Mike Thompson',
                'title' => 'Apprentice',
                'experience' => '1 year',
                'rating' => 4.2,
                'specialties' => json_encode(['Basic Haircut']),
                'phone' => '081234567895',
                'bio' => 'Learning the art.',
                'is_available' => true,
            ]);
        }

        // 5. Elite Barbers Lounge
        if (isset($barbershopUsers[4])) {
            $shop5 = Barbershop::create([
                'user_id' => $barbershopUsers[4]->id,
                'name' => 'Elite Barbers Lounge',
                'address' => 'Jl. Sudirman No. 200, Jakarta',
                'map_url' => 'https://goo.gl/maps/example5',
                'phone_number' => '085534567890',
                'description' => 'Premium grooming experience in a luxurious setting.',
                'latitude' => '-6.2080',
                'longitude' => '106.8450',
                'open_time' => '11:00',
                'close_time' => '23:00',
            ]);

            $haircutCat5 = ServiceCategory::create(['name' => 'Haircut', 'barbershop_id' => $shop5->id]);
            $stylingCat5 = ServiceCategory::create(['name' => 'Hair Styling', 'barbershop_id' => $shop5->id]);

            Service::create([
                'barbershop_id' => $shop5->id,
                'category_id' => $haircutCat5->id,
                'name' => 'Premium Haircut',
                'description' => 'Luxury cut.',
                'price' => 80000,
                'duration_minutes' => 60,
            ]);
            Service::create([
                'barbershop_id' => $shop5->id,
                'category_id' => $stylingCat5->id,
                'name' => 'Luxury Styling',
                'description' => 'High-end styling.',
                'price' => 120000,
                'duration_minutes' => 70,
            ]);

            Capster::create([
                'barbershop_id' => $shop5->id,
                'name' => 'Emma Davis',
                'title' => 'Master Stylist',
                'experience' => '8 years',
                'rating' => 4.9,
                'specialties' => json_encode(['Luxury Cuts', 'Styling']),
                'phone' => '081234567896',
                'bio' => 'Luxury specialist.',
                'is_available' => true,
            ]);
        }

        // 6. Street Style Barbers
        if (isset($barbershopUsers[5])) {
            $shop6 = Barbershop::create([
                'user_id' => $barbershopUsers[5]->id,
                'name' => 'Street Style Barbers',
                'address' => 'Jl. Malioboro No. 50, Yogyakarta',
                'map_url' => 'https://goo.gl/maps/example6',
                'phone_number' => '086634567890',
                'description' => 'Street-inspired cuts for the urban crowd.',
                'latitude' => '-7.7956',
                'longitude' => '110.3695',
                'open_time' => '08:00',
                'close_time' => '21:00',
            ]);

            $haircutCat6 = ServiceCategory::create(['name' => 'Haircut', 'barbershop_id' => $shop6->id]);
            $kidsCat6 = ServiceCategory::create(['name' => 'Kids Haircut', 'barbershop_id' => $shop6->id]);

            Service::create([
                'barbershop_id' => $shop6->id,
                'category_id' => $haircutCat6->id,
                'name' => 'Street Cut',
                'description' => 'Urban street style.',
                'price' => 45000,
                'duration_minutes' => 40,
            ]);
            Service::create([
                'barbershop_id' => $shop6->id,
                'category_id' => $kidsCat6->id,
                'name' => 'Kids Cut',
                'description' => 'Fun cuts for kids.',
                'price' => 30000,
                'duration_minutes' => 30,
            ]);

            Capster::create([
                'barbershop_id' => $shop6->id,
                'name' => 'Jake Miller',
                'title' => 'Street Barber',
                'experience' => '4 years',
                'rating' => 4.6,
                'specialties' => json_encode(['Street Styles', 'Kids']),
                'phone' => '081234567897',
                'bio' => 'Street style expert.',
                'is_available' => true,
            ]);
        }
    }
}
