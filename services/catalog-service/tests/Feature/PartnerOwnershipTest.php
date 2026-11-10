<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesCatalogData;
use Tests\Concerns\IssuesTokens;
use Tests\TestCase;

class PartnerOwnershipTest extends TestCase
{
    use CreatesCatalogData;
    use IssuesTokens;
    use RefreshDatabase;

    public function test_partner_index_uses_jwt_claims(): void
    {
        $ownerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
        $this->makeBarbershop($ownerId, ['name' => 'Owner Shop']);

        $token = $this->tokenFor($ownerId, 'barbershop', [
            'name' => 'Owner Name',
            'email' => 'owner@example.com',
        ]);

        $this->withHeaders($this->authHeader($token))
            ->getJson('/api/partner/barbershop')
            ->assertOk()
            ->assertJsonPath('barbershop.name', 'Owner Shop')
            ->assertJsonPath('user.name', 'Owner Name')
            ->assertJsonPath('user.email', 'owner@example.com');
    }

    public function test_owner_can_manage_services_categories_and_capsters(): void
    {
        $ownerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
        $barbershop = $this->makeBarbershop($ownerId);
        $category = $this->makeCategory($barbershop);
        $service = $this->makeService($barbershop, $category);
        $capster = $this->makeCapster($barbershop);

        $headers = $this->authHeader($this->tokenFor($ownerId, 'barbershop'));

        $this->withHeaders($headers)
            ->putJson("/api/partner/barbershop/services/{$service->id}", [
                'name' => 'Updated Cut',
                'price' => 90000,
            ])
            ->assertOk()
            ->assertJsonPath('service.name', 'Updated Cut');

        $this->withHeaders($headers)
            ->putJson("/api/partner/barbershop/service-categories/{$category->id}", [
                'name' => 'Updated Category',
            ])
            ->assertOk()
            ->assertJsonPath('category.name', 'Updated Category');

        $this->withHeaders($headers)
            ->putJson("/api/partner/barbershop/capsters/{$capster->id}", [
                'name' => 'Updated Capster',
            ])
            ->assertOk()
            ->assertJsonPath('capster.name', 'Updated Capster');

        $this->withHeaders($headers)
            ->postJson("/api/partner/barbershop/capsters/{$capster->id}/toggle-status")
            ->assertOk();

        $this->assertDatabaseHas('capsters', ['id' => $capster->id, 'is_available' => false]);

        $this->withHeaders($headers)
            ->postJson('/api/partner/barbershop/services', [
                'name' => 'Beard Trim',
                'price' => 25000,
                'duration_minutes' => 20,
                'category_id' => $category->id,
            ])
            ->assertStatus(201)
            ->assertJsonPath('service.name', 'Beard Trim');

        $this->withHeaders($headers)
            ->deleteJson("/api/partner/barbershop/services/{$service->id}")
            ->assertOk();

        $this->assertDatabaseMissing('services', ['id' => $service->id]);
    }

    public function test_another_barbershop_cannot_modify_owned_resources(): void
    {
        $barbershop = $this->makeBarbershop('owner-a');
        $category = $this->makeCategory($barbershop);
        $service = $this->makeService($barbershop, $category);
        $capster = $this->makeCapster($barbershop);

        $intruder = $this->tokenFor('owner-b', 'barbershop');
        $headers = $this->authHeader($intruder);

        $this->withHeaders($headers)
            ->putJson("/api/partner/barbershop/services/{$service->id}", ['name' => 'Hijacked'])
            ->assertStatus(403);

        $this->withHeaders($headers)
            ->deleteJson("/api/partner/barbershop/services/{$service->id}")
            ->assertStatus(403);

        $this->withHeaders($headers)
            ->putJson("/api/partner/barbershop/service-categories/{$category->id}", ['name' => 'Hijacked'])
            ->assertStatus(403);

        $this->withHeaders($headers)
            ->deleteJson("/api/partner/barbershop/service-categories/{$category->id}")
            ->assertStatus(403);

        $this->withHeaders($headers)
            ->putJson("/api/partner/barbershop/capsters/{$capster->id}", ['name' => 'Hijacked'])
            ->assertStatus(403);

        $this->withHeaders($headers)
            ->deleteJson("/api/partner/barbershop/capsters/{$capster->id}")
            ->assertStatus(403);

        $this->withHeaders($headers)
            ->postJson("/api/partner/barbershop/capsters/{$capster->id}/toggle-status")
            ->assertStatus(403);

        $this->withHeaders($headers)
            ->deleteJson("/api/barbershop/services/{$service->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('services', ['id' => $service->id, 'name' => 'Classic Cut']);
        $this->assertDatabaseHas('service_categories', ['id' => $category->id, 'name' => 'Haircut']);
        $this->assertDatabaseHas('capsters', [
            'id' => $capster->id,
            'name' => 'Andi',
            'is_available' => true,
        ]);
        $this->assertDatabaseHas('barbershops', ['id' => $barbershop->id, 'name' => 'Test Barbershop']);
    }
}
