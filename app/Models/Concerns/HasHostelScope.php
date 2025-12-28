<?php

namespace App\Models\Concerns;

use App\Models\Hostel;
use App\Models\Scopes\BelongsToHostelScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Trait for models that belong to a hostel (multi-tenancy).
 * Automatically applies global scope and sets hostel_id on creation.
 *
 * @property int $hostel_id
 * @property-read Hostel $hostel
 */
trait HasHostelScope
{
    public static function bootHasHostelScope(): void
    {
        static::addGlobalScope(new BelongsToHostelScope);

        static::creating(function (Model $model) {
            if (empty($model->hostel_id) && auth()->check() && auth()->user()->hostel_id) {
                $model->hostel_id = auth()->user()->hostel_id;
            }
        });
    }

    /**
     * @return BelongsTo<Hostel, $this>
     */
    public function hostel(): BelongsTo
    {
        return $this->belongsTo(Hostel::class);
    }
}
