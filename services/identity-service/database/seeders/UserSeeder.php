<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds the demo accounts described in DemoFixtures.
 *
 * All accounts use the password "password". The identifiers are deterministic
 * so catalog/booking/payment snapshots point at the same user ids.
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make(DemoFixtures::PASSWORD);

        foreach (DemoFixtures::users() as $definition) {
            $id = DemoFixtures::id($definition['key']);

            /** @var User $user */
            $user = User::query()->find($id) ?? new User;

            $user->forceFill([
                'id' => $id,
                'name' => $definition['name'],
                'email' => $definition['email'],
                'role' => $definition['role'],
                'email_verified_at' => now(),
                'password' => $password,
            ])->save();
        }
    }
}
