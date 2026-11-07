<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

#[Fillable([
    'user_id',
    'name',
    'description',
    'image_path',
    'prep_minutes',
    'cook_minutes',
    'difficulty',
    'meal_category',
    'cuisine',
    'servings',
    'calories',
    'steps',
    'dietary_tags',
    'source',
])]
class Recipe extends Model
{
    protected function casts(): array
    {
        return [
            'steps' => 'array',
            'dietary_tags' => 'array',
            'prep_minutes' => 'integer',
            'cook_minutes' => 'integer',
            'servings' => 'integer',
            'calories' => 'integer',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(Ingredient::class, 'recipe_ingredient')
            ->withPivot(['quantity', 'unit', 'note', 'position'])
            ->withTimestamps()
            ->orderByPivot('position');
    }

    public function planEntries(): HasMany
    {
        return $this->hasMany(MealPlanEntry::class);
    }

    public function ownedBy(?int $userId): bool
    {
        return $userId !== null && $this->user_id === $userId;
    }

    public function totalMinutes(): int
    {
        return (int) $this->prep_minutes + (int) $this->cook_minutes;
    }

    public function imageUrl(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        // Seeded recipes point at recipes/<slug>.jpg, which only exists once a
        // photo is dropped in, so answer with the placeholder rather than a 404.
        return Storage::disk('public')->exists($this->image_path) ? asset('storage/'.$this->image_path) : null;
    }

    /** Every recipe the given user has saved plus the shared community library. */
    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        return $query->where(function (Builder $q) use ($user) {
            $q->whereNull('user_id');

            if ($user) {
                $q->orWhere('user_id', $user->id);
            }
        });
    }

    public function scopeOwning(Builder $query, User $user): Builder
    {
        return $query->where('user_id', $user->id);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) {
            return $query;
        }

        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';

        return $query->where(function (Builder $q) use ($like, $term) {
            $q->where('name', 'like', $like)
                ->orWhere('description', 'like', $like)
                ->orWhere('cuisine', 'like', $like)
                ->orWhereHas('ingredients', fn (Builder $i) => $i->where('name', 'like', $like));

            // Also match the individual words, so "chicken rice" finds "Herby chicken rice".
            foreach (preg_split('/\s+/', trim($term)) as $word) {
                if (mb_strlen($word) >= 3) {
                    $q->orWhere('name', 'like', '%'.$word.'%');
                }
            }
        });
    }

    public function scopeWithIngredientSlugs(Builder $query, array $slugs): Builder
    {
        $slugs = array_values(array_unique(array_filter(array_map(
            fn ($slug) => is_string($slug) ? Str::slug($slug) : $slug,
            $slugs
        ))));

        return $query->whereHas(
            'ingredients',
            fn (Builder $i) => $i->whereIn('ingredients.slug', $slugs)
        );
    }
}
