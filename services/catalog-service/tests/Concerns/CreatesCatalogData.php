<?php

namespace Tests\Concerns;

use App\Models\Barbershop;
use App\Models\Capster;
use App\Models\Service;
use App\Models\ServiceCategory;

trait CreatesCatalogData
{
    protected function makeBarbershop(string $userId, array $attributes = []): Barbershop
    {
        return Barbershop::query()->create(array_merge([
            'user_id' => $userId,
            'name' => 'Test Barbershop',
            'address' => 'Jl. Testing No. 1',
            'phone_number' => '081234567890',
            'latitude' => '-6.200000',
            'longitude' => '106.816666',
        ], $attributes));
    }

    protected function makeCategory(Barbershop $barbershop, array $attributes = []): ServiceCategory
    {
        return ServiceCategory::query()->create(array_merge([
            'barbershop_id' => $barbershop->id,
            'name' => 'Haircut',
        ], $attributes));
    }

    protected function makeService(Barbershop $barbershop, ServiceCategory $category, array $attributes = []): Service
    {
        return Service::query()->create(array_merge([
            'barbershop_id' => $barbershop->id,
            'category_id' => $category->id,
            'name' => 'Classic Cut',
            'description' => 'A classic haircut',
            'price' => 75000,
            'duration_minutes' => 45,
            'is_active' => true,
        ], $attributes));
    }

    protected function makeCapster(Barbershop $barbershop, array $attributes = []): Capster
    {
        return Capster::query()->create(array_merge([
            'barbershop_id' => $barbershop->id,
            'name' => 'Andi',
            'title' => 'Senior Capster',
            'experience' => '5 years',
            'rating' => 0,
            'specialties' => ['fade', 'beard'],
            'phone' => '081200000000',
            'is_available' => true,
            'bio' => 'Experienced barber.',
        ], $attributes));
    }
}
