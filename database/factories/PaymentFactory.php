<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => \App\Models\Tenant::factory(),
            'invoice_id' => \App\Models\Invoice::factory(),
            'hostel_id' => \App\Models\Hostel::factory(),
            'amount' => fake()->randomFloat(2, 500, 10000),
            'payment_date' => now(),
            'mode' => fake()->randomElement(['cash', 'esewa', 'khalti', 'bank', 'other']),
            'remarks' => fake()->sentence(),
        ];
    }
}
