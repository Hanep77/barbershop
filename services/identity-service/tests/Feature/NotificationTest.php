<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use App\Support\Jwt\JwtIssuer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_the_owner_can_read_and_mark_notifications(): void
    {
        $owner = User::query()->create([
            'name' => 'Owner',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'customer',
        ]);

        $other = User::query()->create([
            'name' => 'Other',
            'email' => 'other@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'customer',
        ]);

        $notification = Notification::query()->create([
            'user_id' => $owner->id,
            'title' => 'Hello',
            'message' => 'World',
            'type' => 'test',
            'is_read' => false,
        ]);

        $token = app(JwtIssuer::class)->issue($other);
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/notifications/'.$notification->id.'/read')
            ->assertForbidden();

        $token = app(JwtIssuer::class)->issue($owner);
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('unread_count', 1);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/notifications/'.$notification->id.'/read')
            ->assertOk();

        $this->assertTrue($notification->fresh()->is_read);
    }

    public function test_internal_user_endpoints_require_the_internal_token(): void
    {
        $this->getJson('/internal/users/anything')->assertForbidden();

        $user = User::query()->create([
            'name' => 'Owner',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'customer',
        ]);

        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->getJson('/internal/users/'.$user->id)
            ->assertOk()
            ->assertJsonPath('role', 'customer');
    }

    public function test_internal_role_update_promotes_the_user(): void
    {
        $user = User::query()->create([
            'name' => 'Owner',
            'email' => 'owner@example.com',
            'password' => Hash::make('secret123'),
            'role' => 'customer',
        ]);

        $this->withHeader('X-Internal-Token', 'test-internal-token')
            ->patchJson('/internal/users/'.$user->id.'/role', ['role' => 'barbershop'])
            ->assertOk()
            ->assertJsonPath('user.role', 'barbershop');

        $this->assertSame('barbershop', $user->fresh()->role);
    }
}
