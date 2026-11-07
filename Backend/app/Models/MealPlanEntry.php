<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'recipe_id', 'date', 'meal_slot', 'status', 'cooked_at', 'servings', 'notes'])]
class MealPlanEntry extends Model
{
    public const STATUS_PLANNED = 'planned';

    public const STATUS_COOKED = 'cooked';

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'cooked_at' => 'datetime',
            'servings' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    public function isCooked(): bool
    {
        return $this->status === self::STATUS_COOKED;
    }
}
