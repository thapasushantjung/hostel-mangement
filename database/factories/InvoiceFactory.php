<?php

namespace Database\Factories;

use App\Models\Hostel;
use App\Models\Invoice;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = fake()->randomElement([4500, 5000, 6000, 8000]);

        return [
            'hostel_id' => Hostel::factory(),
            'tenant_id' => Tenant::factory(),
            'booking_id' => null,
            'period' => now()->format('Y-m'),
            'amount' => $amount,
            'fine' => 0,
            'paid_amount' => 0,
            'status' => 'pending',
            'due_date' => now()->addDays(15),
            'paid_at' => null,
        ];
    }

    /**
     * Invoice is paid.
     */
    public function paid(): static
    {
        return $this->state(function (array $attributes) {
            $total = ($attributes['amount'] ?? 5000) + ($attributes['fine'] ?? 0);

            return [
                'paid_amount' => $total,
                'status' => 'paid',
                'paid_at' => fake()->dateTimeBetween('-1 month', 'now'),
            ];
        });
    }

    /**
     * Invoice is overdue.
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'overdue',
            'due_date' => fake()->dateTimeBetween('-2 months', '-1 week'),
            'fine' => fake()->randomElement([100, 200, 500]),
        ]);
    }

    /**
     * Invoice for a specific month.
     */
    public function forMonth(int $year, int $month): static
    {
        return $this->state(fn (array $attributes) => [
            'period' => sprintf('%04d-%02d', $year, $month),
            'due_date' => now()->setYear($year)->setMonth($month)->day(15),
        ]);
    }
}
