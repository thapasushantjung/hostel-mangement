<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Payment
 */
class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'tenant_id' => $this->tenant_id,
            'amount' => $this->amount,
            'mode' => $this->mode,
            'mode_label' => $this->mode_label,
            'reference_no' => $this->reference_no,
            'remarks' => $this->remarks,
            'payment_date' => $this->payment_date,
            'created_by' => $this->whenLoaded('createdBy', fn () => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
