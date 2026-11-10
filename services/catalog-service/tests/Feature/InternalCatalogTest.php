<?php

namespace Tests\Feature;

use App\Models\Rating;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesCatalogData;
use Tests\TestCase;

class InternalCatalogTest extends TestCase
{
    use CreatesCatalogData;
    use RefreshDatabase;

    private function internalHeaders(): array
    {
        return ['X-Internal-Token' => 'test-internal-token'];
    }

    public function test_internal_endpoints_require_internal_token(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid');

        $this->getJson("/internal/barbershops/{$barbershop->id}")
            ->assertStatus(403);

        $this->withHeaders(['X-Internal-Token' => 'wrong-token'])
            ->getJson("/internal/barbershops/{$barbershop->id}")
            ->assertStatus(403);

        $this->withHeaders($this->internalHeaders())
            ->getJson("/internal/barbershops/{$barbershop->id}")
            ->assertOk();
    }

    public function test_barbershop_internal_endpoints(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid', ['name' => 'Brody Cut']);

        $this->withHeaders($this->internalHeaders())
            ->getJson("/internal/barbershops/{$barbershop->id}")
            ->assertOk()
            ->assertJsonPath('barbershop.id', $barbershop->id)
            ->assertJsonPath('barbershop.user_id', 'owner-uuid')
            ->assertJsonPath('barbershop.name', 'Brody Cut')
            ->assertJsonPath('barbershop.open_time', '09:00')
            ->assertJsonPath('barbershop.close_time', '21:00')
            ->assertJsonPath('barbershop.is_active', true)
            ->assertJsonMissingPath('barbershop.rating');

        $this->withHeaders($this->internalHeaders())
            ->getJson('/internal/barbershops/by-owner/owner-uuid')
            ->assertOk()
            ->assertJsonPath('barbershop.id', $barbershop->id);

        $this->withHeaders($this->internalHeaders())
            ->getJson('/internal/barbershops/by-owner/unknown-owner')
            ->assertStatus(404);

        $this->withHeaders($this->internalHeaders())
            ->postJson('/internal/barbershops/batch', ['ids' => [$barbershop->id]])
            ->assertOk()
            ->assertJsonPath("barbershops.{$barbershop->id}.name", 'Brody Cut');

        $this->withHeaders($this->internalHeaders())
            ->getJson('/internal/barbershops/does-not-exist')
            ->assertStatus(404);
    }

    public function test_service_and_capster_internal_endpoints(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid');
        $category = $this->makeCategory($barbershop);
        $service = $this->makeService($barbershop, $category);
        $capster = $this->makeCapster($barbershop);

        $this->withHeaders($this->internalHeaders())
            ->getJson("/internal/services/{$service->id}")
            ->assertOk()
            ->assertJsonPath('service.id', $service->id)
            ->assertJsonPath('service.barbershop_id', $barbershop->id)
            ->assertJsonPath('service.name', 'Classic Cut')
            ->assertJsonPath('service.price', 75000)
            ->assertJsonPath('service.duration_minutes', 45)
            ->assertJsonPath('service.is_active', true);

        $this->withHeaders($this->internalHeaders())
            ->getJson("/internal/capsters/{$capster->id}")
            ->assertOk()
            ->assertJsonPath('capster.id', $capster->id)
            ->assertJsonPath('capster.barbershop_id', $barbershop->id)
            ->assertJsonPath('capster.name', 'Andi')
            ->assertJsonPath('capster.is_available', true);

        $this->withHeaders($this->internalHeaders())
            ->getJson('/internal/services/unknown')
            ->assertStatus(404);

        $this->withHeaders($this->internalHeaders())
            ->getJson('/internal/capsters/unknown')
            ->assertStatus(404);
    }

    public function test_validate_booking_returns_pricing_and_relations(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid');
        $category = $this->makeCategory($barbershop);
        $service = $this->makeService($barbershop, $category);
        $capster = $this->makeCapster($barbershop);

        $this->withHeaders($this->internalHeaders())
            ->postJson('/internal/catalog/validate-booking', [
                'barbershop_id' => $barbershop->id,
                'service_id' => $service->id,
                'capster_id' => $capster->id,
            ])
            ->assertOk()
            ->assertJsonPath('valid', true)
            ->assertJsonPath('barbershop.id', $barbershop->id)
            ->assertJsonPath('service.id', $service->id)
            ->assertJsonPath('service.price', 75000)
            ->assertJsonPath('service.duration_minutes', 45)
            ->assertJsonPath('capster.id', $capster->id)
            ->assertJsonPath('capster.name', 'Andi')
            ->assertJsonPath('capster.barbershop_id', $barbershop->id);
    }

    public function test_validate_booking_rejects_inactive_or_mismatched_catalog(): void
    {
        $inactiveShop = $this->makeBarbershop('owner-a', ['is_active' => false]);
        $inactiveCategory = $this->makeCategory($inactiveShop);
        $inactiveService = $this->makeService($inactiveShop, $inactiveCategory);
        $inactiveCapster = $this->makeCapster($inactiveShop);

        $this->withHeaders($this->internalHeaders())
            ->postJson('/internal/catalog/validate-booking', [
                'barbershop_id' => $inactiveShop->id,
                'service_id' => $inactiveService->id,
                'capster_id' => $inactiveCapster->id,
            ])
            ->assertStatus(422)
            ->assertJsonPath('valid', false)
            ->assertJsonPath('message', 'Barbershop is not available');

        $barbershop = $this->makeBarbershop('owner-b');
        $category = $this->makeCategory($barbershop);
        $service = $this->makeService($barbershop, $category);
        $capster = $this->makeCapster($barbershop);

        $otherShop = $this->makeBarbershop('owner-c');
        $otherCategory = $this->makeCategory($otherShop);
        $foreignService = $this->makeService($otherShop, $otherCategory);
        $foreignCapster = $this->makeCapster($otherShop);

        $this->withHeaders($this->internalHeaders())
            ->postJson('/internal/catalog/validate-booking', [
                'barbershop_id' => $barbershop->id,
                'service_id' => $foreignService->id,
                'capster_id' => $capster->id,
            ])
            ->assertStatus(422)
            ->assertJsonPath('valid', false);

        $this->withHeaders($this->internalHeaders())
            ->postJson('/internal/catalog/validate-booking', [
                'barbershop_id' => $barbershop->id,
                'service_id' => $service->id,
                'capster_id' => $foreignCapster->id,
            ])
            ->assertStatus(422)
            ->assertJsonPath('valid', false);

        $service->update(['is_active' => false]);

        $this->withHeaders($this->internalHeaders())
            ->postJson('/internal/catalog/validate-booking', [
                'barbershop_id' => $barbershop->id,
                'service_id' => $service->id,
                'capster_id' => $capster->id,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Service is not active');
    }

    public function test_ratings_by_bookings_internal_endpoint(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid');

        Rating::query()->create([
            'user_id' => 'customer-uuid',
            'user_name' => 'Budi',
            'user_avatar' => null,
            'barbershop_id' => $barbershop->id,
            'booking_id' => 7001,
            'rating' => 5,
            'comment' => 'Great',
        ]);

        $this->withHeaders($this->internalHeaders())
            ->postJson('/internal/ratings/by-bookings', ['booking_ids' => [7001, 7002]])
            ->assertOk()
            ->assertJsonPath('ratings.7001.rating', 5)
            ->assertJsonPath('ratings.7001.comment', 'Great')
            ->assertJsonMissingPath('ratings.7002');
    }
}
