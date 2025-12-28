<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\Hostel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    protected $model = Expense::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = Expense::categories();

        return [
            'hostel_id' => Hostel::factory(),
            'category' => fake()->randomElement($categories),
            'description' => fake()->sentence(),
            'amount' => fake()->randomFloat(2, 500, 15000),
            'expense_date' => fake()->dateTimeBetween('-3 months', 'now'),
        ];
    }

    /**
     * Electricity expense.
     */
    public function electricity(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'electricity',
            'description' => 'Monthly electricity bill',
            'amount' => fake()->randomFloat(2, 5000, 15000),
        ]);
    }

    /**
     * Water expense.
     */
    public function water(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'water',
            'description' => 'Monthly water bill',
            'amount' => fake()->randomFloat(2, 1000, 3000),
        ]);
    }

    /**
     * Maintenance expense.
     */
    public function maintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'maintenance',
            'description' => fake()->sentence(),
            'amount' => fake()->randomFloat(2, 2000, 10000),
        ]);
    }
}
