<?php

namespace Database\Factories;

use App\Models\Hostel;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tenant>
 */
class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $nepaliLocations = [
            'Chitwan', 'Jhapa', 'Morang', 'Sunsari', 'Kaski', 'Rupandehi',
            'Kailali', 'Parsa', 'Bara', 'Dhading', 'Makwanpur', 'Nawalparasi',
        ];

        return [
            'hostel_id' => Hostel::factory(),
            'name' => fake()->name(),
            'phone' => '+977-'.fake()->numerify('##########'),
            'parent_phone' => '+977-'.fake()->numerify('##########'),
            'photo_url' => null,
            'home_location' => fake()->randomElement($nepaliLocations),
            'id_type' => fake()->randomElement(['citizenship', 'passport', 'driving_license']),
            'id_number' => fake()->numerify('##-##-##-#####'),
            'status' => 'active',
        ];
    }

    /**
     * Tenant is in leaving status.
     */
    public function leaving(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'leaving',
        ]);
    }

    /**
     * Tenant has left.
     */
    public function left(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'left',
        ]);
    }
}
