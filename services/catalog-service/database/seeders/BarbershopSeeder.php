<?php

namespace Database\Seeders;

use App\Models\Barbershop;
use App\Models\BarbershopImage;
use App\Models\Capster;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;

/**
 * Seeds barbershops, their gallery, categories, services and capsters.
 * Identifiers come from DemoFixtures so identity/booking/payment agree.
 */
class BarbershopSeeder extends Seeder
{
    public function run(): void
    {
        foreach (DemoFixtures::shops() as $definition) {
            $shopId = DemoFixtures::id($definition['key']);

            $this->upsert(Barbershop::class, $shopId, [
                'user_id' => DemoFixtures::id($definition['owner']),
                'name' => $definition['name'],
                'address' => $definition['address'],
                'map_url' => $definition['map_url'],
                'phone_number' => $definition['phone_number'],
                'description' => $definition['description'],
                'is_active' => true,
                'latitude' => $definition['latitude'],
                'longitude' => $definition['longitude'],
                'open_time' => $definition['open_time'],
                'close_time' => $definition['close_time'],
            ]);

            foreach ($definition['images'] as $index => $url) {
                $this->upsert(BarbershopImage::class, DemoFixtures::id($definition['key'].'.image.'.$index), [
                    'barbershop_id' => $shopId,
                    'image_url' => $url,
                    'is_primary' => $index === 0,
                ]);
            }

            $categoryIds = [];

            foreach ($definition['categories'] as $category) {
                $categoryIds[$category['key']] = DemoFixtures::id($category['key']);

                $this->upsert(ServiceCategory::class, $categoryIds[$category['key']], [
                    'barbershop_id' => $shopId,
                    'name' => $category['name'],
                ]);
            }

            foreach ($definition['services'] as $service) {
                $this->upsert(Service::class, DemoFixtures::id($service['key']), [
                    'barbershop_id' => $shopId,
                    'category_id' => $categoryIds[$service['category']],
                    'name' => $service['name'],
                    'description' => $service['description'],
                    'price' => $service['price'],
                    'duration_minutes' => $service['duration'],
                    'is_active' => true,
                ]);
            }

            foreach ($definition['capsters'] as $capster) {
                $this->upsert(Capster::class, DemoFixtures::id($capster['key']), [
                    'barbershop_id' => $shopId,
                    'name' => $capster['name'],
                    'title' => $capster['title'],
                    'experience' => $capster['experience'],
                    'rating' => $capster['rating'],
                    'specialties' => $capster['specialties'],
                    'phone' => $capster['phone'],
                    'is_available' => true,
                    'bio' => $capster['bio'],
                    'image' => null,
                ]);
            }
        }
    }

    /**
     * Insert or update a row with a deterministic primary key.
     *
     * @param  class-string<Model>  $class
     * @param  array<string, mixed>  $attributes
     */
    private function upsert(string $class, string $id, array $attributes): Model
    {
        /** @var Model $record */
        $record = $class::query()->find($id) ?? new $class;

        $record->forceFill(['id' => $id] + $attributes)->save();

        return $record;
    }
}
