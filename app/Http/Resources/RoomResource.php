<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Room
 */
class RoomResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'floor_id' => $this->floor_id,
            'room_number' => $this->room_number,
            'gender' => $this->gender,
            'base_price' => $this->base_price,
            'capacity' => $this->capacity,
            'beds' => BedResource::collection($this->whenLoaded('beds')),
            'floor' => new FloorResource($this->whenLoaded('floor')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
