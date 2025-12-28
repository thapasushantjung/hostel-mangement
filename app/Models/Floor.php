<?php

namespace App\Models;

use App\Models\Concerns\HasHostelScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $hostel_id
 * @property string $name
 * @property int $order
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Hostel $hostel
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Room> $rooms
 */
class Floor extends Model
{
    /** @use HasFactory<\Database\Factories\FloorFactory> */
    use HasFactory;

    use HasHostelScope;

    protected $fillable = [
        'hostel_id',
        'name',
        'order',
    ];

    /**
     * @return HasMany<Room, $this>
     */
    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class)->orderBy('room_number');
    }
}
