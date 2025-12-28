<?php

namespace App\Models;

use App\Models\Concerns\HasHostelScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $hostel_id
 * @property string $category
 * @property string|null $description
 * @property float $amount
 * @property \Illuminate\Support\Carbon $expense_date
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Hostel $hostel
 */
class Expense extends Model
{
    /** @use HasFactory<\Database\Factories\ExpenseFactory> */
    use HasFactory;

    use HasHostelScope;

    protected $fillable = [
        'hostel_id',
        'category',
        'description',
        'amount',
        'expense_date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date',
        ];
    }

    /**
     * Available expense categories.
     *
     * @return array<string>
     */
    public static function categories(): array
    {
        return [
            'water',
            'electricity',
            'gas',
            'internet',
            'maintenance',
            'cleaning',
            'other',
        ];
    }
}
