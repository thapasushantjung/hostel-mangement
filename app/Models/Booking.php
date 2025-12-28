<?php

namespace App\Models;

use App\Models\Concerns\HasHostelScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $hostel_id
 * @property int $tenant_id
 * @property int $bed_id
 * @property \Illuminate\Support\Carbon $start_date
 * @property \Illuminate\Support\Carbon|null $end_date
 * @property float $agreed_rent
 * @property float $advance_paid
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Hostel $hostel
 * @property-read Tenant $tenant
 * @property-read Bed $bed
 */
class Booking extends Model
{
    /** @use HasFactory<\Database\Factories\BookingFactory> */
    use HasFactory;

    use HasHostelScope;

    protected $fillable = [
        'hostel_id',
        'tenant_id',
        'bed_id',
        'start_date',
        'end_date',
        'agreed_rent',
        'advance_paid',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'agreed_rent' => 'decimal:2',
            'advance_paid' => 'decimal:2',
            'is_active' => 'boolean',
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
     * @return BelongsTo<Bed, $this>
     */
    public function bed(): BelongsTo
    {
        return $this->belongsTo(Bed::class);
    }

    /**
     * Calculate the number of days stayed.
     */
    public function getDaysStayedAttribute(): int
    {
        $endDate = $this->end_date ?? now();

        return $this->start_date->diffInDays($endDate);
    }
}
