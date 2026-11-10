<?php

namespace Tests\Feature;

use App\Models\BarbershopImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Concerns\CreatesCatalogData;
use Tests\Concerns\IssuesTokens;
use Tests\TestCase;

class BarbershopImageTest extends TestCase
{
    use CreatesCatalogData;
    use IssuesTokens;
    use RefreshDatabase;

    public function test_owner_can_upload_list_reorder_and_delete_images(): void
    {
        Storage::fake('public');

        $ownerId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
        $barbershop = $this->makeBarbershop($ownerId);
        $headers = $this->authHeader($this->tokenFor($ownerId, 'barbershop'));

        $this->withHeaders($headers)
            ->postJson('/api/barbershop/images', [
                'image' => UploadedFile::fake()->image('first.jpg', 640, 480),
            ])
            ->assertStatus(201)
            ->assertJsonPath('image.is_primary', true)
            ->assertJsonPath('message', 'Image uploaded successfully');

        $this->assertDatabaseCount('barbershop_images', 1);
        $this->assertCount(1, Storage::disk('public')->allFiles("barbershops/{$barbershop->id}/gallery"));

        $this->withHeaders($headers)
            ->postJson('/api/barbershop/images', [
                'image' => UploadedFile::fake()->image('second.png', 640, 480),
            ])
            ->assertStatus(201)
            ->assertJsonPath('image.is_primary', false);

        $images = BarbershopImage::query()->orderBy('created_at')->get();
        $first = $images[0];
        $second = $images[1];

        $this->withHeaders($headers)
            ->getJson('/api/barbershop/images')
            ->assertOk()
            ->assertJsonCount(2, 'images')
            ->assertJsonPath('images.0.id', $first->id);

        $this->withHeaders($headers)
            ->patchJson("/api/barbershop/images/{$second->id}/set-primary")
            ->assertOk()
            ->assertJsonPath('image.is_primary', true);

        $this->assertFalse($first->fresh()->is_primary);
        $this->assertTrue($second->fresh()->is_primary);

        $this->withHeaders($headers)
            ->getJson('/api/barbershop/images')
            ->assertOk()
            ->assertJsonPath('images.0.id', $second->id);

        $firstPath = $this->storagePath($first->image_url);
        $secondPath = $this->storagePath($second->image_url);

        $this->withHeaders($headers)
            ->deleteJson("/api/barbershop/images/{$first->id}")
            ->assertOk();

        Storage::disk('public')->assertMissing($firstPath);
        $this->assertDatabaseMissing('barbershop_images', ['id' => $first->id]);

        $this->withHeaders($headers)
            ->deleteJson("/api/barbershop/images/{$second->id}")
            ->assertOk();

        Storage::disk('public')->assertMissing($secondPath);
        $this->assertDatabaseCount('barbershop_images', 0);
    }

    public function test_images_are_visible_publicly(): void
    {
        $barbershop = $this->makeBarbershop('owner-uuid');

        BarbershopImage::query()->create([
            'barbershop_id' => $barbershop->id,
            'image_url' => 'http://localhost/storage/barbershops/x/a.jpg',
            'is_primary' => false,
        ]);
        BarbershopImage::query()->create([
            'barbershop_id' => $barbershop->id,
            'image_url' => 'http://localhost/storage/barbershops/x/b.jpg',
            'is_primary' => true,
        ]);

        $this->getJson("/api/barbershop/{$barbershop->id}/images")
            ->assertOk()
            ->assertJsonCount(2, 'images')
            ->assertJsonPath('images.0.image_url', 'http://localhost/storage/barbershops/x/b.jpg');
    }

    public function test_another_barbershop_cannot_touch_images(): void
    {
        Storage::fake('public');

        $barbershop = $this->makeBarbershop('owner-a');
        $image = BarbershopImage::query()->create([
            'barbershop_id' => $barbershop->id,
            'image_url' => 'http://localhost/storage/barbershops/x/a.jpg',
            'is_primary' => true,
        ]);

        $headers = $this->authHeader($this->tokenFor('owner-b', 'barbershop'));

        $this->withHeaders($headers)
            ->patchJson("/api/barbershop/images/{$image->id}/set-primary")
            ->assertStatus(404);

        $this->withHeaders($headers)
            ->deleteJson("/api/barbershop/images/{$image->id}")
            ->assertStatus(404);

        $this->assertDatabaseHas('barbershop_images', ['id' => $image->id]);
    }

    private function storagePath(string $url): string
    {
        $path = parse_url($url, PHP_URL_PATH) ?: $url;
        $path = ltrim($path, '/');

        return Str::after($path, 'storage/');
    }
}
