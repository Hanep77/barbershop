<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\Jwt\JwtIssuer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_forces_customer_role_and_returns_tokens(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Budi',
            'email' => 'budi@example.com',
            'role' => 'barbershop',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonStructure(['access_token', 'refresh_token', 'token_type', 'expires_in']);

        $user = User::query()->where('email', 'budi@example.com')->firstOrFail();
        $this->assertSame('customer', $user->role);
    }

    public function test_login_rejects_bad_credentials(): void
    {
        User::query()->create([
            'name' => 'Budi',
            'email' => 'budi@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'customer',
        ]);

        $this->postJson('/api/login', [
            'email' => 'budi@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    public function test_me_requires_a_valid_token(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();

        $user = User::query()->create([
            'name' => 'Budi',
            'email' => 'budi@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'customer',
        ]);

        $token = app(JwtIssuer::class)->issue($user);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('email', 'budi@example.com');
    }

    public function test_refresh_rotates_tokens_and_rejects_reuse(): void
    {
        $user = User::query()->create([
            'name' => 'Budi',
            'email' => 'budi@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'customer',
        ]);

        $login = $this->postJson('/api/login', [
            'email' => 'budi@example.com',
            'password' => 'secret123',
        ])->assertOk();

        $firstRefresh = $login->json('refresh_token');

        $rotated = $this->postJson('/api/auth/refresh', [
            'refresh_token' => $firstRefresh,
        ])->assertOk();

        $this->assertNotSame($firstRefresh, $rotated->json('refresh_token'));

        $this->postJson('/api/auth/refresh', [
            'refresh_token' => $firstRefresh,
        ])->assertStatus(401);
    }

    public function test_logout_revokes_the_refresh_token(): void
    {
        $user = User::query()->create([
            'name' => 'Budi',
            'email' => 'budi@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'customer',
        ]);

        $login = $this->postJson('/api/login', [
            'email' => 'budi@example.com',
            'password' => 'secret123',
        ]);

        $refresh = $login->json('refresh_token');
        $token = $login->json('access_token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/logout', ['refresh_token' => $refresh])
            ->assertOk();

        $this->postJson('/api/auth/refresh', ['refresh_token' => $refresh])
            ->assertStatus(401);
    }
}
