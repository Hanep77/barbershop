<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Barbershop>
 */
class BarbershopFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->company() . ' Barbershop',
            'address' => $this->faker->address(),
            'map_url' => 'https://maps.google.com/?q=' . urlencode($this->faker->address()),
            'phone_number' => $this->faker->phoneNumber(),
            'description' => $this->faker->paragraph(),
            'is_active' => true,
            'latitude' => (string) $this->faker->latitude(),
            'longitude' => (string) $this->faker->longitude(),
        ];
    }
}
