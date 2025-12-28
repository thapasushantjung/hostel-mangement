<?php

namespace Database\Factories;

use App\Models\Bed;
use App\Models\Booking;
use App\Models\Hostel;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    protected $model = Booking::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'hostel_id' => Hostel::factory(),
            'tenant_id' => Tenant::factory(),
            'bed_id' => Bed::factory(),
            'start_date' => fake()->dateTimeBetween('-6 months', 'now'),
            'end_date' => null,
            'agreed_rent' => fake()->randomElement([4500, 5000, 6000, 8000]),
            'advance_paid' => fake()->randomElement([0, 5000, 10000]),
            'is_active' => true,
        ];
    }

    /**
     * Booking is inactive (ended).
     */
    public function ended(): static
    {
        return $this->state(fn (array $attributes) => [
            'end_date' => fake()->dateTimeBetween($attributes['start_date'] ?? '-3 months', 'now'),
            'is_active' => false,
        ]);
    }

    /**
     * Recent booking (started within the last month).
     */
    public function recent(): static
    {
        return $this->state(fn (array $attributes) => [
            'start_date' => fake()->dateTimeBetween('-1 month', 'now'),
        ]);
    }
}
