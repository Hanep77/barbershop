<?php

namespace Database\Seeders;

use App\Models\Barbershop;
use App\Models\Capster;
use Illuminate\Database\Seeder;

class CapsterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $barbershops = Barbershop::all();

        $capstersData = [
            [
                'name' => 'Marcus Chen',
                'title' => 'Master Barber',
                'experience' => '10 years',
                'rating' => 4.9,
                'specialties' => json_encode(['Fade', 'Classic Cut', 'Beard Grooming']),
                'phone' => '081234567891',
                'bio' => 'Marcus is a master of the traditional straight razor shave and classic pompadours.',
                'image' => 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop',
            ],
            [
                'name' => 'David Wilson',
                'title' => 'Senior Barber',
                'experience' => '5 years',
                'rating' => 4.7,
                'specialties' => json_encode(['Taper', 'Scissor Cut']),
                'phone' => '081234567892',
                'bio' => 'David specializes in modern styles and precision scissor work.',
                'image' => 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1974&auto=format&fit=crop',
            ],
            [
                'name' => 'Alex Rodriguez',
                'title' => 'Barber',
                'experience' => '3 years',
                'rating' => 4.5,
                'specialties' => json_encode(['Kids Haircut', 'Hair Coloring']),
                'phone' => '081234567893',
                'bio' => 'Alex loves working with kids and creative coloring techniques.',
                'image' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop',
            ],
            [
                'name' => 'Sarah Johnson',
                'title' => 'Stylist',
                'experience' => '7 years',
                'rating' => 4.8,
                'specialties' => json_encode(['Hair Styling', 'Facial Treatment']),
                'phone' => '081234567894',
                'bio' => 'Sarah brings creativity and expertise to every styling session.',
                'image' => 'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=1974&auto=format&fit=crop',
            ],
            [
                'name' => 'Mike Thompson',
                'title' => 'Apprentice Barber',
                'experience' => '1 year',
                'rating' => 4.2,
                'specialties' => json_encode(['Basic Haircut', 'Shaving']),
                'phone' => '081234567895',
                'bio' => 'Mike is passionate about learning the art of barbering.',
                'image' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
            ],
        ];

        foreach ($barbershops as $barbershop) {
            // Create 3-5 capsters per barbershop
            $numCapsters = rand(3, 5);
            $selectedCapsters = collect($capstersData)->random($numCapsters);

            foreach ($selectedCapsters as $capsterData) {
                Capster::create(array_merge($capsterData, [
                    'barbershop_id' => $barbershop->id,
                    'is_available' => true,
                ]));
            }
        }
    }
}
