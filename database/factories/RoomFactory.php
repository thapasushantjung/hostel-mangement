<?php

namespace Database\Factories;

use App\Models\Floor;
use App\Models\Hostel;
use App\Models\Room;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Room>
 */
class RoomFactory extends Factory
{
    protected $model = Room::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'hostel_id' => Hostel::factory(),
            'floor_id' => Floor::factory(),
            'room_number' => fake()->numerify('###'),
            'gender' => fake()->randomElement(['male', 'female', 'any']),
            'base_price' => fake()->randomElement([4500, 5000, 6000, 8000]),
            'capacity' => fake()->randomElement([1, 2, 3, 4]),
        ];
    }

    /**
     * Room for males only.
     */
    public function male(): static
    {
        return $this->state(fn (array $attributes) => [
            'gender' => 'male',
        ]);
    }

    /**
     * Room for females only.
     */
    public function female(): static
    {
        return $this->state(fn (array $attributes) => [
            'gender' => 'female',
        ]);
    }

    /**
     * Single occupancy room (1 bed).
     */
    public function single(): static
    {
        return $this->state(fn (array $attributes) => [
            'capacity' => 1,
            'base_price' => 8000,
        ]);
    }

    /**
     * Double occupancy room (2 beds).
     */
    public function double(): static
    {
        return $this->state(fn (array $attributes) => [
            'capacity' => 2,
            'base_price' => 6000,
        ]);
    }

    /**
     * Quad occupancy room (4 beds).
     */
    public function quad(): static
    {
        return $this->state(fn (array $attributes) => [
            'capacity' => 4,
            'base_price' => 4500,
        ]);
    }
}
