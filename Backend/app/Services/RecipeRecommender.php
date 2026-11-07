<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Scores every recipe the user can see against what's in their kitchen.
 * Shared by the dashboard's "made for your kitchen" strip and the ingredient
 * finder so both rank identically.
 */
class RecipeRecommender
{
    /**
     * @param  array<int, string>  $extraSlugs  ad-hoc ingredient names, already slugged
     * @return Collection<int, array{recipe: Recipe, matched: int, total: int, percent: int, missing: array<int, string>}>
     */
    public function rank(?User $user, array $extraSlugs = [], bool $requireMatch = true): Collection
    {
        $have = $this->haveSlugs($user, $extraSlugs);

        $recipes = Recipe::query()
            ->visibleTo($user)
            ->with(['ingredients', 'owner:id,name'])
            ->get();

        return $recipes
            ->map(function (Recipe $recipe) use ($have) {
                $matched = $recipe->ingredients->filter(fn (Ingredient $i) => in_array($i->slug, $have, true))->count();
                $total = $recipe->ingredients->count();

                return [
                    'recipe' => $recipe,
                    'matched' => $matched,
                    'total' => $total,
                    'percent' => $total > 0 ? (int) round($matched / $total * 100) : 0,
                    'missing' => $recipe->ingredients
                        ->reject(fn (Ingredient $i) => in_array($i->slug, $have, true))
                        ->pluck('name')
                        ->all(),
                ];
            })
            ->when($requireMatch, fn (Collection $rows) => $rows->filter(fn ($row) => $row['matched'] > 0))
            ->sortBy(fn ($row) => [-$row['matched'], $row['total']])
            ->values();
    }

    /** @return array<int, string> */
    public function haveSlugs(?User $user, array $extraSlugs = []): array
    {
        return array_values(array_unique([...($user?->kitchenIngredientSlugs() ?? []), ...$extraSlugs]));
    }

    /** @return array<int, array{name: string, count: int}> */
    public function mostRequestedMissing(Collection $ranked, int $limit = 6): array
    {
        return $ranked
            ->flatMap(fn (array $row) => $row['missing'])
            ->countBy()
            ->sortDesc()
            ->take($limit)
            ->map(fn ($count, $name) => ['name' => $name, 'count' => $count])
            ->values()
            ->all();
    }
}
