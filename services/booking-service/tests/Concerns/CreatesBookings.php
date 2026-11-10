<?php

namespace Tests\Concerns;

use App\Models\Booking;

trait CreatesBookings
{
    protected string $customerId = '11111111-1111-4111-8111-111111111111';

    protected string $ownerId = '22222222-2222-4222-8222-222222222222';

    protected string $shopId = '33333333-3333-4333-8333-333333333333';

    protected string $serviceId = '44444444-4444-4444-8444-444444444444';

    protected string $capsterId = '55555555-5555-4555-8555-555555555555';

    protected function makeBooking(array $attributes = []): Booking
    {
        return Booking::query()->create(array_merge([
            'user_id' => $this->customerId,
            'user_name' => 'Budi',
            'user_email' => 'budi@example.com',
            'barbershop_id' => $this->shopId,
            'barbershop_name' => 'Brody Barbershop',
            'barbershop_owner_id' => $this->ownerId,
            'service_id' => $this->serviceId,
            'service_name' => 'Haircut',
            'service_price' => 50000,
            'service_duration_minutes' => 30,
            'capster_id' => $this->capsterId,
            'capster_name' => 'Andi',
            'booking_date' => now()->addDays(2)->toDateString(),
            'booking_time' => '10:00',
            'status' => 'pending',
            'total_price' => 50000,
        ], $attributes));
    }

    protected function catalogValidationResponse(array $overrides = []): array
    {
        return array_replace_recursive([
            'valid' => true,
            'barbershop' => [
                'id' => $this->shopId,
                'user_id' => $this->ownerId,
                'name' => 'Brody Barbershop',
                'address' => 'Jl. Merdeka 1',
                'open_time' => '09:00',
                'close_time' => '17:00',
                'is_active' => true,
            ],
            'service' => [
                'id' => $this->serviceId,
                'barbershop_id' => $this->shopId,
                'name' => 'Haircut',
                'price' => 50000,
                'duration_minutes' => 30,
                'is_active' => true,
            ],
            'capster' => [
                'id' => $this->capsterId,
                'barbershop_id' => $this->shopId,
                'name' => 'Andi',
                'is_available' => true,
            ],
        ], $overrides);
    }
}
