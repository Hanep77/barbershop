<?php

namespace Tests\Feature;

use App\Models\Barbershop;
use App\Models\Capster;
use App\Models\Rating;
use App\Support\Outbox\OutboxEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\CreatesCatalogData;
use Tests\Concerns\IssuesTokens;
use Tests\TestCase;

class RatingTest extends TestCase
{
    use CreatesCatalogData;
    use IssuesTokens;
    use RefreshDatabase;

    public function test_rating_is_rejected_when_booking_validation_fails(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid');
        $this->makeCategory($barbershop);

        Http::fake([
            'http://booking-service/*' => Http::response([
                'valid' => false,
                'status' => 'pending',
                'user_id' => 'customer-uuid',
            ]),
        ]);

        $token = $this->tokenFor('customer-uuid', 'customer', ['name' => 'Budi']);

        $this->withHeaders($this->authHeader($token))
            ->postJson('/api/ratings', [
                'barbershop_id' => $barbershop->id,
                'booking_id' => 9001,
                'rating' => 5,
                'comment' => 'Great!',
            ])
            ->assertStatus(400)
            ->assertJsonPath('message', 'Review hanya dapat diberikan untuk pesanan yang sudah selesai.');

        $this->assertDatabaseMissing('ratings', ['booking_id' => 9001]);
        $this->assertDatabaseMissing('outbox_events', ['type' => 'ReviewCreated']);
    }

    public function test_rating_is_rejected_when_booking_belongs_to_another_user(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid');
        $this->makeCategory($barbershop);

        Http::fake([
            'http://booking-service/*' => Http::response([
                'valid' => true,
                'status' => 'completed',
                'user_id' => 'someone-else',
            ]),
        ]);

        $this->withHeaders($this->authHeader($this->tokenFor('customer-uuid')))
            ->postJson('/api/ratings', [
                'barbershop_id' => $barbershop->id,
                'booking_id' => 9002,
                'rating' => 4,
            ])
            ->assertStatus(400);

        $this->assertDatabaseMissing('ratings', ['booking_id' => 9002]);
    }

    public function test_rating_is_accepted_and_updates_averages_and_outbox(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid', ['name' => 'Brody Cut']);
        $category = $this->makeCategory($barbershop);
        $capster = $this->makeCapster($barbershop);
        $this->makeService($barbershop, $category);

        Http::fake([
            'http://booking-service/*' => Http::response([
                'valid' => true,
                'status' => 'completed',
                'user_id' => 'customer-uuid',
                'capster_id' => $capster->id,
                'barbershop_id' => $barbershop->id,
            ]),
        ]);

        $token = $this->tokenFor('customer-uuid', 'customer', [
            'name' => 'Budi Santoso',
            'avatar' => 'https://example.com/budi.jpg',
        ]);

        $response = $this->withHeaders($this->authHeader($token))
            ->postJson('/api/ratings', [
                'barbershop_id' => $barbershop->id,
                'booking_id' => 9003,
                'rating' => 5,
                'comment' => 'Mantap!',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Review berhasil dikirim!')
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.user_id', 'customer-uuid')
            ->assertJsonPath('data.user_name', 'Budi Santoso')
            ->assertJsonPath('data.user_avatar', 'https://example.com/budi.jpg')
            ->assertJsonPath('data.capster_id', $capster->id);

        $this->assertDatabaseHas('ratings', [
            'booking_id' => 9003,
            'user_name' => 'Budi Santoso',
            'user_avatar' => 'https://example.com/budi.jpg',
            'rating' => 5,
        ]);

        $this->assertEquals(5.0, $barbershop->fresh()->rating);
        $this->assertEquals(5.0, $capster->fresh()->rating);

        $event = OutboxEvent::query()->where('type', 'ReviewCreated')->firstOrFail();

        $this->assertSame('owner-uuid', $event->payload['barbershop_owner_id']);
        $this->assertSame('Brody Cut', $event->payload['barbershop_name']);
        $this->assertSame('Budi Santoso', $event->payload['user_name']);
        $this->assertSame(5, $event->payload['rating']);
        $this->assertSame('Mantap!', $event->payload['comment']);
        $this->assertIsInt($event->payload['rating_id']);

        Http::assertSent(fn (Request $request) => $request->method() === 'POST'
            && $request->url() === 'http://booking-service/internal/bookings/9003/validate-review'
            && $request['user_id'] === 'customer-uuid');
    }

    public function test_duplicate_rating_for_same_booking_is_rejected(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid');
        $this->makeCategory($barbershop);

        Rating::query()->create([
            'user_id' => 'customer-uuid',
            'user_name' => 'Budi',
            'user_avatar' => null,
            'barbershop_id' => $barbershop->id,
            'booking_id' => 9004,
            'rating' => 4,
            'comment' => 'First review',
        ]);

        Http::fake();

        $this->withHeaders($this->authHeader($this->tokenFor('customer-uuid')))
            ->postJson('/api/ratings', [
                'barbershop_id' => $barbershop->id,
                'booking_id' => 9004,
                'rating' => 5,
            ])
            ->assertStatus(400)
            ->assertJsonPath('message', 'Pesanan ini sudah pernah direview.');

        $this->assertSame(1, Rating::query()->where('booking_id', 9004)->count());
        Http::assertNothingSent();
    }

    public function test_rating_update_and_delete_are_author_only_and_recompute_averages(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid');
        $capster = $this->makeCapster($barbershop);

        $rating = Rating::query()->create([
            'user_id' => 'customer-uuid',
            'user_name' => 'Budi',
            'user_avatar' => null,
            'barbershop_id' => $barbershop->id,
            'capster_id' => $capster->id,
            'booking_id' => 9005,
            'rating' => 5,
            'comment' => 'Great',
        ]);

        $barbershop->update(['rating' => 5]);
        $capster->update(['rating' => 5]);

        $other = $this->tokenFor('other-uuid', 'customer');

        $this->withHeaders($this->authHeader($other))
            ->putJson("/api/ratings/{$rating->id}", ['rating' => 1])
            ->assertStatus(403);

        $author = $this->tokenFor('customer-uuid', 'customer');

        $this->withHeaders($this->authHeader($author))
            ->putJson("/api/ratings/{$rating->id}", ['rating' => 2, 'comment' => 'Updated'])
            ->assertOk()
            ->assertJsonPath('data.rating', 2);

        $this->assertEquals(2.0, $barbershop->fresh()->rating);
        $this->assertEquals(2.0, $capster->fresh()->rating);

        $this->withHeaders($this->authHeader($other))
            ->deleteJson("/api/ratings/{$rating->id}")
            ->assertStatus(403);

        $this->withHeaders($this->authHeader($author))
            ->deleteJson("/api/ratings/{$rating->id}")
            ->assertOk();

        $this->assertDatabaseMissing('ratings', ['id' => $rating->id]);
        $this->assertEquals(0.0, $barbershop->fresh()->rating);
        $this->assertEquals(0.0, $capster->fresh()->rating);
    }

    public function test_public_ratings_use_snapshots_and_capster_summary(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid');
        $capster = $this->makeCapster($barbershop);

        Rating::query()->create([
            'user_id' => 'customer-uuid',
            'user_name' => 'Budi',
            'user_avatar' => 'https://example.com/budi.jpg',
            'barbershop_id' => $barbershop->id,
            'capster_id' => $capster->id,
            'booking_id' => 9006,
            'rating' => 5,
            'comment' => 'Perfect',
        ]);

        $this->getJson("/api/barbershop/{$barbershop->id}/ratings")
            ->assertOk()
            ->assertJsonPath('data.0.user_name', 'Budi')
            ->assertJsonPath('data.0.user_avatar', 'https://example.com/budi.jpg')
            ->assertJsonPath('data.0.user.name', 'Budi')
            ->assertJsonPath('data.0.capster.id', $capster->id)
            ->assertJsonPath('data.0.capster.name', 'Andi');
    }
}
