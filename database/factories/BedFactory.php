<?php

namespace Database\Factories;

use App\Models\Bed;
use App\Models\Hostel;
use App\Models\Room;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Bed>
 */
class BedFactory extends Factory
{
    protected $model = Bed::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'hostel_id' => Hostel::factory(),
            'room_id' => Room::factory(),
            'label' => fake()->randomElement(['A', 'B', 'C', 'D']),
            'status' => 'available',
        ];
    }

    /**
     * Bed is occupied.
     */
    public function occupied(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'occupied',
        ]);
    }

    /**
     * Bed is under maintenance.
     */
    public function maintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'maintenance',
        ]);
    }

    /**
     * Set a specific bed label.
     */
    public function label(string $label): static
    {
        return $this->state(fn (array $attributes) => [
            'label' => $label,
        ]);
    }
}
