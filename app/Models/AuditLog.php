<?php

namespace App\Models;

use App\Models\Concerns\HasHostelScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property int $id
 * @property int $hostel_id
 * @property int $user_id
 * @property string $auditable_type
 * @property int $auditable_id
 * @property string $action
 * @property array|null $old_values
 * @property array|null $new_values
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Hostel $hostel
 * @property-read User $user
 * @property-read Model $auditable
 */
class AuditLog extends Model
{
    use HasHostelScope;

    public const ACTION_CREATED = 'created';

    public const ACTION_UPDATED = 'updated';

    public const ACTION_VOIDED = 'voided';

    public const ACTION_PAYMENT_ADDED = 'payment_added';

    protected $fillable = [
        'hostel_id',
        'user_id',
        'auditable_type',
        'auditable_id',
        'action',
        'old_values',
        'new_values',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Create an audit log entry.
     */
    public static function log(
        Model $model,
        string $action,
        ?array $oldValues = null,
        ?array $newValues = null
    ): self {
        return self::create([
            'hostel_id' => auth()->user()?->hostel_id,
            'user_id' => auth()->id(),
            'auditable_type' => get_class($model),
            'auditable_id' => $model->id,
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }

    /**
     * Get human-readable action label.
     */
    public function getActionLabelAttribute(): string
    {
        return match ($this->action) {
            self::ACTION_CREATED => 'Created',
            self::ACTION_UPDATED => 'Updated',
            self::ACTION_VOIDED => 'Voided/Cancelled',
            self::ACTION_PAYMENT_ADDED => 'Payment Added',
            default => ucfirst($this->action),
        };
    }
}
