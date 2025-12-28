<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $invoice_id
 * @property string $category
 * @property string|null $description
 * @property float $amount
 * @property int $quantity
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Invoice $invoice
 */
class InvoiceLineItem extends Model
{
    public const CATEGORY_RENT = 'rent';

    public const CATEGORY_WIFI = 'wifi';

    public const CATEGORY_ELECTRICITY = 'electricity';

    public const CATEGORY_FOOD = 'food';

    public const CATEGORY_FINE = 'fine';

    public const CATEGORY_ARREARS = 'arrears';

    public const CATEGORY_OTHER = 'other';

    public const CATEGORIES = [
        self::CATEGORY_RENT,
        self::CATEGORY_WIFI,
        self::CATEGORY_ELECTRICITY,
        self::CATEGORY_FOOD,
        self::CATEGORY_FINE,
        self::CATEGORY_ARREARS,
        self::CATEGORY_OTHER,
    ];

    protected $fillable = [
        'invoice_id',
        'category',
        'description',
        'amount',
        'quantity',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'quantity' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Invoice, $this>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Get total for this line (amount * quantity).
     */
    public function getTotalAttribute(): float
    {
        return $this->amount * $this->quantity;
    }

    /**
     * Get human-readable category label.
     */
    public function getCategoryLabelAttribute(): string
    {
        return match ($this->category) {
            self::CATEGORY_RENT => 'Rent',
            self::CATEGORY_WIFI => 'WiFi',
            self::CATEGORY_ELECTRICITY => 'Electricity',
            self::CATEGORY_FOOD => 'Food/Mess',
            self::CATEGORY_FINE => 'Fine',
            self::CATEGORY_ARREARS => 'Previous Dues',
            self::CATEGORY_OTHER => 'Other',
            default => ucfirst($this->category),
        };
    }
}
