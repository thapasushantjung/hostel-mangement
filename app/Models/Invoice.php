<?php

namespace App\Models;

use App\Models\Concerns\HasHostelScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $hostel_id
 * @property int $tenant_id
 * @property int|null $booking_id
 * @property string $period
 * @property float $amount
 * @property float $fine
 * @property float $paid_amount
 * @property string $status
 * @property \Illuminate\Support\Carbon $due_date
 * @property \Illuminate\Support\Carbon|null $paid_at
 * @property string|null $cancelled_reason
 * @property int|null $cancelled_by
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Hostel $hostel
 * @property-read Tenant $tenant
 * @property-read Booking|null $booking
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Payment> $payments
 * @property-read User|null $cancelledBy
 */
class Invoice extends Model
{
    /** @use HasFactory<\Database\Factories\InvoiceFactory> */
    use HasFactory;

    use HasHostelScope;
    use SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PENDING = 'pending';

    public const STATUS_PARTIAL = 'partial';

    public const STATUS_PAID = 'paid';

    public const STATUS_OVERDUE = 'overdue';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'hostel_id',
        'tenant_id',
        'booking_id',
        'period',
        'amount',
        'fine',
        'paid_amount',
        'status',
        'due_date',
        'paid_at',
        'cancelled_reason',
        'cancelled_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'fine' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_date' => 'date',
            'paid_at' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * @return BelongsTo<Booking, $this>
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * @return HasMany<InvoiceLineItem, $this>
     */
    public function lineItems(): HasMany
    {
        return $this->hasMany(InvoiceLineItem::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /**
     * Get the total amount due (amount + fine).
     */
    public function getTotalDueAttribute(): float
    {
        return $this->amount + $this->fine;
    }

    /**
     * Get the remaining balance (total - paid).
     */
    public function getBalanceAttribute(): float
    {
        return $this->total_due - $this->paid_amount;
    }

    /**
     * Check if the invoice is overdue.
     */
    public function isOverdue(): bool
    {
        return ! in_array($this->status, ['paid', 'cancelled', 'draft'])
            && $this->due_date->isPast();
    }

    /**
     * Recalculate paid_amount from payments and update status.
     */
    public function recalculatePayments(): void
    {
        $totalPaid = $this->payments()->sum('amount');
        $this->paid_amount = $totalPaid;

        if ($totalPaid >= $this->total_due) {
            $this->status = self::STATUS_PAID;
            $this->paid_at = now();
        } elseif ($totalPaid > 0) {
            $this->status = self::STATUS_PARTIAL;
        } elseif ($this->isOverdue()) {
            $this->status = self::STATUS_OVERDUE;
        } else {
            $this->status = self::STATUS_PENDING;
        }

        $this->save();
    }

    /**
     * Add a payment to this invoice.
     */
    public function addPayment(float $amount, string $mode, ?string $referenceNo = null, ?string $remarks = null): Payment
    {
        $payment = $this->payments()->create([
            'hostel_id' => $this->hostel_id,
            'tenant_id' => $this->tenant_id,
            'created_by' => auth()->id(),
            'amount' => $amount,
            'mode' => $mode,
            'reference_no' => $referenceNo,
            'remarks' => $remarks,
            'payment_date' => now(),
        ]);

        // Log the payment
        AuditLog::log($this, AuditLog::ACTION_PAYMENT_ADDED, null, [
            'payment_id' => $payment->id,
            'amount' => $amount,
            'mode' => $mode,
        ]);

        // Recalculate totals
        $this->recalculatePayments();

        return $payment;
    }

    /**
     * Void/cancel the invoice (soft delete with reason).
     */
    public function void(string $reason): void
    {
        $oldValues = $this->only(['status', 'deleted_at']);

        $this->update([
            'status' => self::STATUS_CANCELLED,
            'cancelled_reason' => $reason,
            'cancelled_by' => auth()->id(),
        ]);

        $this->delete(); // Soft delete

        AuditLog::log($this, AuditLog::ACTION_VOIDED, $oldValues, [
            'status' => self::STATUS_CANCELLED,
            'reason' => $reason,
        ]);
    }

    /**
     * Mark the invoice as paid (legacy method, prefer addPayment).
     */
    public function markAsPaid(?float $amount = null): void
    {
        $this->update([
            'paid_amount' => $amount ?? $this->total_due,
            'status' => self::STATUS_PAID,
            'paid_at' => now(),
        ]);
    }
}
