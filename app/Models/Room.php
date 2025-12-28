<?php

namespace App\Models;

use App\Models\Concerns\HasHostelScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $hostel_id
 * @property int $floor_id
 * @property string $room_number
 * @property string $gender
 * @property float $base_price
 * @property int $capacity
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Hostel $hostel
 * @property-read Floor $floor
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Bed> $beds
 */
class Room extends Model
{
    /** @use HasFactory<\Database\Factories\RoomFactory> */
    use HasFactory;

    use HasHostelScope;

    protected $fillable = [
        'hostel_id',
        'floor_id',
        'room_number',
        'gender',
        'base_price',
        'capacity',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'capacity' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Floor, $this>
     */
    public function floor(): BelongsTo
    {
        return $this->belongsTo(Floor::class);
    }

    /**
     * @return HasMany<Bed, $this>
     */
    public function beds(): HasMany
    {
        return $this->hasMany(Bed::class)->orderBy('label');
    }
}
