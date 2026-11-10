<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\CreatesBookings;
use Tests\TestCase;

class AvailabilityTest extends TestCase
{
    use CreatesBookings, RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function fakeCatalog(string $open = '09:00', string $close = '12:00', int $duration = 30): void
    {
        Http::fake([
            'http://catalog-service/internal/catalog/validate-booking' => Http::response(
                $this->catalogValidationResponse([
                    'barbershop' => ['open_time' => $open, 'close_time' => $close],
                    'service' => ['duration_minutes' => $duration],
                ]),
                200,
            ),
            '*' => Http::response([], 200),
        ]);
    }

    private function slotsUrl(array $query = []): string
    {
        return '/api/barbershop/'.$this->shopId.'/available-slots?'.http_build_query(array_merge([
            'date' => '2026-11-10',
            'capster_id' => $this->capsterId,
            'service_id' => $this->serviceId,
        ], $query));
    }

    public function test_slots_are_generated_on_a_thirty_minute_grid(): void
    {
        Carbon::setTestNow('2026-11-10 08:00:00');
        $this->fakeCatalog();

        $response = $this->getJson($this->slotsUrl());

        $response->assertStatus(200)->assertExactJson([
            'slots' => ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
        ]);
    }

    public function test_existing_booking_blocks_overlapping_slots(): void
    {
        Carbon::setTestNow('2026-11-10 08:00:00');
        $this->fakeCatalog();

        $this->makeBooking([
            'booking_date' => '2026-11-10',
            'booking_time' => '09:30',
            'service_duration_minutes' => 60,
        ]);

        $this->getJson($this->slotsUrl())->assertStatus(200)->assertExactJson([
            'slots' => ['09:00', '10:30', '11:00', '11:30'],
        ]);
    }

    public function test_past_slots_are_skipped(): void
    {
        Carbon::setTestNow('2026-11-10 10:10:00');
        $this->fakeCatalog();

        $this->getJson($this->slotsUrl())->assertStatus(200)->assertExactJson([
            'slots' => ['10:30', '11:00', '11:30'],
        ]);
    }

    public function test_missing_parameters_return_400(): void
    {
        $this->getJson('/api/barbershop/'.$this->shopId.'/available-slots?date=2026-11-10')
            ->assertStatus(400);
    }

    public function test_invalid_catalog_validation_returns_422(): void
    {
        Http::fake([
            'http://catalog-service/internal/catalog/validate-booking' => Http::response(['valid' => false], 200),
            '*' => Http::response([], 200),
        ]);

        $this->getJson($this->slotsUrl())->assertStatus(422);
    }

    public function test_catalog_outage_returns_503(): void
    {
        Http::fake(['*' => Http::response([], 503)]);

        $this->getJson($this->slotsUrl())->assertStatus(503);
    }
}
