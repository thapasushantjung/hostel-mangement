<?php

namespace App\Models;

use App\Models\Concerns\HasHostelScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property int $hostel_id
 * @property string $name
 * @property string|null $phone
 * @property string|null $parent_phone
 * @property string|null $photo_url
 * @property string|null $home_location
 * @property string|null $id_type
 * @property string|null $id_number
 * @property string $status
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Hostel $hostel
 * @property-read Booking|null $activeBooking
 * @property-read Bed|null $currentBed
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Booking> $bookings
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Invoice> $invoices
 */
class Tenant extends Model
{
    /** @use HasFactory<\Database\Factories\TenantFactory> */
    use HasFactory;

    use HasHostelScope;

    protected $fillable = [
        'hostel_id',
        'name',
        'phone',
        'parent_phone',
        'photo_url',
        'home_location',
        'id_type',
        'id_number',
        'status',
    ];

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * @return HasOne<Booking, $this>
     */
    public function activeBooking(): HasOne
    {
        return $this->hasOne(Booking::class)->where('is_active', true);
    }

    /**
     * @return HasMany<Invoice, $this>
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Get the current bed through the active booking.
     */
    public function getCurrentBedAttribute(): ?Bed
    {
        return $this->activeBooking?->bed;
    }

    /**
     * Calculate the total due amount for this tenant.
     */
    public function getTotalDueAttribute(): float
    {
        return $this->invoices()
            ->whereIn('status', ['pending', 'overdue'])
            ->sum(\DB::raw('amount + fine - paid_amount'));
    }
}
