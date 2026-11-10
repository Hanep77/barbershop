<?php

namespace Tests\Feature;

use App\Models\Barbershop;
use App\Models\BarbershopImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\CreatesCatalogData;
use Tests\Concerns\IssuesTokens;
use Tests\TestCase;

class BarbershopTest extends TestCase
{
    use CreatesCatalogData;
    use IssuesTokens;
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Brody Cut',
            'address' => 'Jl. Merdeka No. 10',
            'map_url' => 'https://maps.example.com/brody',
            'phone_number' => '081234567890',
            'description' => 'Fresh cuts every day.',
            'is_active' => true,
            'latitude' => '-6.200000',
            'longitude' => '106.816666',
        ], $overrides);
    }

    public function test_unauthenticated_requests_return_401(): void
    {
        $this->getJson('/api/partner/barbershop')->assertStatus(401);
        $this->postJson('/api/barbershop', $this->payload())->assertStatus(401);
    }

    public function test_customer_cannot_access_partner_routes(): void
    {
        $this->makeBarbershop('owner-uuid');

        $token = $this->tokenFor('customer-uuid', 'customer');

        $this->withHeaders($this->authHeader($token))
            ->getJson('/api/partner/barbershop')
            ->assertStatus(403);

        $this->withHeaders($this->authHeader($token))
            ->postJson('/api/partner/barbershop/services', [
                'name' => 'Cut',
                'price' => 10000,
                'duration_minutes' => 30,
            ])
            ->assertStatus(403);
    }

    public function test_creates_barbershop_and_promotes_role(): void
    {
        $userId = '11111111-1111-4111-8111-111111111111';

        Http::fake([
            'http://identity-service/*' => Http::response([
                'user' => ['id' => $userId, 'role' => 'barbershop'],
            ]),
        ]);

        $token = $this->tokenFor($userId, 'customer', [
            'name' => 'Budi',
            'email' => 'budi@example.com',
            'avatar' => 'https://example.com/avatar.jpg',
        ]);

        $response = $this->withHeaders($this->authHeader($token))
            ->postJson('/api/barbershop', $this->payload());

        $response->assertStatus(201)
            ->assertJsonPath('user.id', $userId)
            ->assertJsonPath('user.name', 'Budi')
            ->assertJsonPath('user.email', 'budi@example.com')
            ->assertJsonPath('user.role', 'barbershop')
            ->assertJsonPath('user.avatar', 'https://example.com/avatar.jpg')
            ->assertJsonPath('user.barbershop.name', 'Brody Cut')
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email', 'role', 'avatar', 'barbershop' => ['id', 'user_id', 'name']],
            ]);

        $this->assertDatabaseHas('barbershops', [
            'user_id' => $userId,
            'name' => 'Brody Cut',
        ]);

        Http::assertSent(fn (Request $request) => $request->method() === 'PATCH'
            && $request->url() === "http://identity-service/internal/users/{$userId}/role"
            && $request['role'] === 'barbershop'
            && $request->hasHeader('X-Internal-Token', 'test-internal-token'));
    }

    public function test_shop_is_kept_when_identity_promotion_fails(): void
    {
        $userId = '22222222-2222-4222-8222-222222222222';

        Http::fake([
            'http://identity-service/*' => Http::response(['message' => 'boom'], 500),
        ]);

        $response = $this->withHeaders($this->authHeader($this->tokenFor($userId)))
            ->postJson('/api/barbershop', $this->payload());

        $response->assertStatus(201);

        $this->assertDatabaseHas('barbershops', ['user_id' => $userId]);
    }

    public function test_duplicate_shop_returns_conflict(): void
    {
        $userId = '33333333-3333-4333-8333-333333333333';
        $this->makeBarbershop($userId);

        $response = $this->withHeaders($this->authHeader($this->tokenFor($userId)))
            ->postJson('/api/barbershop', $this->payload());

        $response->assertStatus(409)
            ->assertJsonPath('message', 'User already has a barbershop');
    }

    public function test_public_list_and_detail_expose_aggregates(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid', ['name' => 'Searchable Shop']);
        $category = $this->makeCategory($barbershop);
        $this->makeService($barbershop, $category, ['price' => 50000]);
        $this->makeService($barbershop, $category, ['name' => 'Beard Trim', 'price' => 30000]);
        $this->makeCapster($barbershop);

        BarbershopImage::query()->create([
            'barbershop_id' => $barbershop->id,
            'image_url' => 'http://localhost/storage/barbershops/shop.jpg',
            'is_primary' => true,
        ]);

        \App\Models\Rating::query()->create([
            'user_id' => 'rater-uuid',
            'user_name' => 'Rater',
            'user_avatar' => null,
            'barbershop_id' => $barbershop->id,
            'booking_id' => 10,
            'rating' => 4,
            'comment' => 'Nice',
        ]);

        $this->getJson('/api/barbershop?search=Searchable')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.name', 'Searchable Shop')
            ->assertJsonPath('0.ratings_count', 1)
            ->assertJsonPath('0.services_min_price', 30000)
            ->assertJsonPath('0.coverImage', Barbershop::FALLBACK_COVER_IMAGE);

        $this->getJson("/api/barbershop/{$barbershop->id}")
            ->assertOk()
            ->assertJsonPath('id', $barbershop->id)
            ->assertJsonPath('capsters_count', 1)
            ->assertJsonPath('ratings_count', 1)
            ->assertJsonPath('services_min_price', 30000)
            ->assertJsonCount(2, 'services')
            ->assertJsonCount(1, 'capsters')
            ->assertJsonCount(1, 'images')
            ->assertJsonPath('primary_image.image_url', 'http://localhost/storage/barbershops/shop.jpg')
            ->assertJsonPath('images.0.is_primary', true);
    }

    public function test_owner_can_update_and_soft_delete_shop(): void
    {
        $ownerId = '44444444-4444-4444-8444-444444444444';
        $barbershop = $this->makeBarbershop($ownerId);

        $this->withHeaders($this->authHeader($this->tokenFor($ownerId, 'barbershop')))
            ->putJson("/api/barbershop/{$barbershop->id}", ['name' => 'Renamed Shop'])
            ->assertOk()
            ->assertJsonPath('name', 'Renamed Shop');

        $this->withHeaders($this->authHeader($this->tokenFor($ownerId, 'barbershop')))
            ->deleteJson("/api/barbershop/{$barbershop->id}")
            ->assertOk();

        $this->assertSoftDeleted('barbershops', ['id' => $barbershop->id]);
    }

    public function test_non_owner_cannot_update_or_delete_shop(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid');
        $other = $this->tokenFor('other-uuid', 'barbershop');

        $this->withHeaders($this->authHeader($other))
            ->putJson("/api/barbershop/{$barbershop->id}", ['name' => 'Hijacked'])
            ->assertStatus(403);

        $this->withHeaders($this->authHeader($other))
            ->deleteJson("/api/barbershop/{$barbershop->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('barbershops', ['id' => $barbershop->id, 'name' => 'Test Barbershop']);
        $this->assertNotSoftDeleted('barbershops', ['id' => $barbershop->id]);
    }
}
