<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Booking
 */
class BookingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'bed_id' => $this->bed_id,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'agreed_rent' => $this->agreed_rent,
            'advance_paid' => $this->advance_paid,
            'is_active' => $this->is_active,
            'days_stayed' => $this->days_stayed,
            'tenant' => new TenantResource($this->whenLoaded('tenant')),
            'bed' => new BedResource($this->whenLoaded('bed')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
