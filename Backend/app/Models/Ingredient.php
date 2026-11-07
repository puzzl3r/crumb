<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

#[Fillable(['name', 'slug', 'category', 'default_unit'])]
class Ingredient extends Model
{
    protected static function booted(): void
    {
        static::saving(function (Ingredient $ingredient) {
            $ingredient->slug = $ingredient->slug ?: Str::slug($ingredient->name);
        });
    }

    public function recipes(): BelongsToMany
    {
        return $this->belongsToMany(Recipe::class, 'recipe_ingredient');
    }

    /** Find by a user-typed name, reusing the catalogue entry when one exists. */
    public static function resolve(string $name): self
    {
        $name = trim($name);
        $slug = Str::slug($name);

        return static::query()->firstOrCreate(
            ['slug' => $slug],
            ['name' => $name]
        );
    }

    public function scopeSlugs(Builder $query, array $names): Builder
    {
        return $query->whereIn('slug', array_map(fn ($n) => Str::slug($n), $names));
    }
}
