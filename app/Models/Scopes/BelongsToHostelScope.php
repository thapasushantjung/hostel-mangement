<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class BelongsToHostelScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     * Automatically filters queries by the authenticated user's hostel_id.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (auth()->check() && auth()->user()->hostel_id) {
            $builder->where($model->getTable().'.hostel_id', auth()->user()->hostel_id);
        }
    }
}
