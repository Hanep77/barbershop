<?php

namespace Database\Seeders;

use App\Models\Barbershop;
use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;

class ServiceCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $barbershops = Barbershop::all();

        $categories = [
            'Haircut',
            'Shaving & Beard',
            'Hair Coloring',
            'Hair Styling',
            'Facial Treatment',
            'Kids Haircut',
        ];

        foreach ($barbershops as $barbershop) {
            // Create 2-4 categories per barbershop
            $selectedCategories = collect($categories)->random(rand(2, 4));
            foreach ($selectedCategories as $category) {
                ServiceCategory::create([
                    'name' => $category,
                    'barbershop_id' => $barbershop->id,
                ]);
            }
        }
    }
}
