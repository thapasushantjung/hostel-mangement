<?php

namespace App\Models;

use App\Models\Concerns\HasHostelScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property int $hostel_id
 * @property int $room_id
 * @property string $label
 * @property string $status
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Hostel $hostel
 * @property-read Room $room
 * @property-read Booking|null $activeBooking
 * @property-read Tenant|null $currentTenant
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Booking> $bookings
 */
class Bed extends Model
{
    /** @use HasFactory<\Database\Factories\BedFactory> */
    use HasFactory;

    use HasHostelScope;

    protected $fillable = [
        'hostel_id',
        'room_id',
        'label',
        'status',
    ];

    /**
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

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
     * Get the current tenant through the active booking.
     */
    public function getCurrentTenantAttribute(): ?Tenant
    {
        return $this->activeBooking?->tenant;
    }

    /**
     * Check if the bed is available.
     */
    public function isAvailable(): bool
    {
        return $this->status === 'available' && $this->activeBooking === null;
    }
}
