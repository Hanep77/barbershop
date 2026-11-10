<?php

namespace Tests\Feature;

use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class EventConsumptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_created_event_creates_a_notification_once(): void
    {
        $payload = [
            'booking_id' => 10,
            'user_id' => 'customer-1',
            'user_name' => 'Budi',
            'barbershop_id' => 'shop-1',
            'barbershop_owner_id' => 'owner-1',
            'barbershop_name' => 'Shop',
            'service_name' => 'Haircut',
            'capster_name' => 'Andi',
            'booking_date' => '2026-11-10',
            'booking_time' => '14:00',
        ];

        $fieldMap = [
            'event_id' => 'event-1',
            'type' => 'BookingCreated',
            'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
        ];

        Redis::shouldReceive('xgroup')->andReturnTrue();
        Redis::shouldReceive('xautoclaim')->andReturnTrue();
        Redis::shouldReceive('xack')->andReturnTrue();
        Redis::shouldReceive('xreadgroup')->once()->andReturn([
            'barberbrody:events' => [
                '1-0' => $fieldMap,
            ],
        ]);

        $this->artisan('events:consume', ['group' => 'identity', '--once' => true])->assertSuccessful();

        $this->assertDatabaseCount('notifications', 1);
        $notification = Notification::query()->firstOrFail();
        $this->assertSame('owner-1', $notification->user_id);
        $this->assertSame('booking_created', $notification->type);
        $this->assertDatabaseHas('processed_events', ['event_id' => 'event-1']);
    }

    public function test_duplicate_event_is_acknowledged_without_duplicate_notification(): void
    {
        $payload = [
            'booking_id' => 11,
            'user_id' => 'customer-1',
            'user_name' => 'Budi',
            'barbershop_id' => 'shop-1',
            'barbershop_owner_id' => 'owner-1',
            'barbershop_name' => 'Shop',
            'service_name' => 'Haircut',
            'capster_name' => 'Andi',
            'booking_date' => '2026-11-10',
            'booking_time' => '15:00',
        ];

        $fields = [
            'event_id' => 'event-2',
            'type' => 'BookingCreated',
            'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
        ];

        Redis::shouldReceive('xgroup')->andReturnTrue();
        Redis::shouldReceive('xautoclaim')->andReturnTrue();
        Redis::shouldReceive('xack')->andReturnTrue();
        Redis::shouldReceive('xreadgroup')->twice()->andReturn(
            ['barberbrody:events' => ['2-0' => $fields]],
            ['barberbrody:events' => ['3-0' => $fields]],
        );

        $this->artisan('events:consume', ['group' => 'identity', '--once' => true])->assertSuccessful();
        $this->artisan('events:consume', ['group' => 'identity', '--once' => true])->assertSuccessful();

        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseCount('processed_events', 1);
    }
}
