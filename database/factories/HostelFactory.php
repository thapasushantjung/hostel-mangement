<?php

namespace Database\Factories;

use App\Models\Hostel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Hostel>
 */
class HostelFactory extends Factory
{
    protected $model = Hostel::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $nepaliCities = ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar', 'Birgunj'];

        return [
            'name' => fake()->company().' Hostel',
            'owner_id' => User::factory(),
            'address' => fake()->streetAddress().', '.fake()->randomElement($nepaliCities),
            'phone' => '+977-'.fake()->numerify('##########'),
            'pricing_config' => [
                'single' => 8000,
                'double' => 6000,
                'triple' => 5000,
                'quad' => 4500,
            ],
        ];
    }

    /**
     * Configure the hostel with an owner.
     */
    public function withOwner(?User $owner = null): static
    {
        return $this->state(fn (array $attributes) => [
            'owner_id' => $owner?->id ?? User::factory(),
        ]);
    }
}
