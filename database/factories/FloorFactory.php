<?php

namespace Database\Factories;

use App\Models\Floor;
use App\Models\Hostel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Floor>
 */
class FloorFactory extends Factory
{
    protected $model = Floor::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'hostel_id' => Hostel::factory(),
            'name' => 'Floor '.fake()->numberBetween(1, 5),
            'order' => fake()->numberBetween(0, 5),
        ];
    }

    /**
     * Set the floor as ground floor.
     */
    public function ground(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Ground Floor',
            'order' => 0,
        ]);
    }

    /**
     * Set a specific floor number.
     */
    public function number(int $number): static
    {
        $suffix = match ($number) {
            1 => 'st',
            2 => 'nd',
            3 => 'rd',
            default => 'th',
        };

        return $this->state(fn (array $attributes) => [
            'name' => $number.$suffix.' Floor',
            'order' => $number,
        ]);
    }
}
