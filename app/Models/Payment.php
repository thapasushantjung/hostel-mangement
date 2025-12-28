<?php

namespace App\Models;

use App\Models\Concerns\HasHostelScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $hostel_id
 * @property int $invoice_id
 * @property int $tenant_id
 * @property int|null $created_by
 * @property float $amount
 * @property string $mode
 * @property string|null $reference_no
 * @property string|null $remarks
 * @property \Illuminate\Support\Carbon $payment_date
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Hostel $hostel
 * @property-read Invoice $invoice
 * @property-read Tenant $tenant
 * @property-read User|null $createdBy
 */
class Payment extends Model
{
    /** @use HasFactory<\Database\Factories\PaymentFactory> */
    use HasFactory;

    use HasHostelScope;

    public const MODES = ['cash', 'esewa', 'khalti', 'bank', 'other'];

    protected $fillable = [
        'hostel_id',
        'invoice_id',
        'tenant_id',
        'created_by',
        'amount',
        'mode',
        'reference_no',
        'remarks',
        'payment_date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'date',
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
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get human-readable mode label.
     */
    public function getModeLabelAttribute(): string
    {
        return match ($this->mode) {
            'cash' => 'Cash',
            'esewa' => 'eSewa',
            'khalti' => 'Khalti',
            'bank' => 'Bank Transfer',
            'other' => 'Other',
            default => ucfirst($this->mode),
        };
    }
}
