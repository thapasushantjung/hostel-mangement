<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Bed
 */
class BedResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'room_id' => $this->room_id,
            'label' => $this->label,
            'status' => $this->status,
            'room' => new RoomResource($this->whenLoaded('room')),
            'current_booking' => new BookingResource($this->whenLoaded('activeBooking')),
            'current_tenant' => $this->when(
                $this->relationLoaded('activeBooking') && $this->activeBooking?->relationLoaded('tenant'),
                fn () => new TenantResource($this->activeBooking->tenant)
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
