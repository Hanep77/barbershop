<?php

namespace Database\Seeders;

use App\Models\Barbershop;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $barbershops = Barbershop::all();

        $servicesData = [
            [
                'name' => 'Classic Haircut',
                'description' => 'Precision cut with scissors and clippers.',
                'price' => 50000,
                'duration_minutes' => 45,
                'category' => 'Haircut',
            ],
            [
                'name' => 'Haircut + Wash',
                'description' => 'Haircut with professional shampoo and conditioning.',
                'price' => 75000,
                'duration_minutes' => 60,
                'category' => 'Haircut',
            ],
            [
                'name' => 'Hot Towel Shave',
                'description' => 'Traditional straight razor shave with hot towels.',
                'price' => 35000,
                'duration_minutes' => 30,
                'category' => 'Shaving & Beard',
            ],
            [
                'name' => 'Beard Trim',
                'description' => 'Professional beard shaping and trimming.',
                'price' => 25000,
                'duration_minutes' => 20,
                'category' => 'Shaving & Beard',
            ],
            [
                'name' => 'Hair Coloring',
                'description' => 'Professional hair coloring service.',
                'price' => 150000,
                'duration_minutes' => 120,
                'category' => 'Hair Coloring',
            ],
            [
                'name' => 'Hair Styling',
                'description' => 'Professional styling for special occasions.',
                'price' => 100000,
                'duration_minutes' => 60,
                'category' => 'Hair Styling',
            ],
            [
                'name' => 'Kids Haircut',
                'description' => 'Gentle haircut for children.',
                'price' => 30000,
                'duration_minutes' => 30,
                'category' => 'Kids Haircut',
            ],
            [
                'name' => 'Creambath',
                'description' => 'Deep conditioning treatment for hair.',
                'price' => 80000,
                'duration_minutes' => 45,
                'category' => 'Hair Styling',
            ],
        ];

        foreach ($barbershops as $barbershop) {
            $categories = ServiceCategory::where('barbershop_id', $barbershop->id)->get();

            // Create 5-8 services per barbershop
            $selectedServices = collect($servicesData)->random(rand(5, 8));

            foreach ($selectedServices as $serviceData) {
                $category = $categories->where('name', $serviceData['category'])->first();
                if ($category) {
                    Service::create([
                        'barbershop_id' => $barbershop->id,
                        'category_id' => $category->id,
                        'name' => $serviceData['name'],
                        'description' => $serviceData['description'],
                        'price' => $serviceData['price'],
                        'duration_minutes' => $serviceData['duration_minutes'],
                        'is_active' => true,
                    ]);
                }
            }
        }
    }
}
