<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user (using barbershop role as admin)
        User::create([
            'name' => 'Admin Barbershop',
            'email' => 'admin@barbershop.com',
            'password' => Hash::make('password'),
            'role' => 'barbershop',
            'email_verified_at' => now(),
        ]);

        // Create 5 barbershop owners
        User::factory(5)->create(['role' => 'barbershop']);

        // Create 20 customers
        User::factory(20)->create(['role' => 'customer']);
    }
}
