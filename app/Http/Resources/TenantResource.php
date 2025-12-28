<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Tenant
 */
class TenantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'parent_phone' => $this->parent_phone,
            'photo_url' => $this->photo_url,
            'home_location' => $this->home_location,
            'id_type' => $this->id_type,
            'id_number' => $this->id_number,
            'status' => $this->status,
            'total_due' => $this->when($this->relationLoaded('invoices'), fn () => $this->total_due),
            'active_booking' => new BookingResource($this->whenLoaded('activeBooking')),
            'current_bed' => new BedResource($this->whenLoaded('activeBooking.bed')),
            'invoices' => InvoiceResource::collection($this->whenLoaded('invoices')),
            'bookings' => BookingResource::collection($this->whenLoaded('bookings')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
