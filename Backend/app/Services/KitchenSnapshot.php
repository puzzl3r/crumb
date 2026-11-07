<?php

namespace App\Services;

use App\Models\User;

/**
 * Per-request cache of what the signed-in cook already has, so annotating a
 * page of recipes does not re-query the kitchen for every row.
 */
class KitchenSnapshot
{
    /** @var array<string, array<int, string>> */
    private array $slugsByUser = [];

    public function slugsFor(?User $user): array
    {
        if (! $user) {
            return [];
        }

        return $this->slugsByUser[$user->id] ??= $user->loadMissing('kitchenItems.ingredient')
            ->kitchenItems
            ->map(fn ($item) => $item->ingredient->slug)
            ->all();
    }

    /** @return array{matched: int, total: int, missing: array<int, string>} */
    public function compare(?User $user, iterable $recipeIngredients): array
    {
        $have = $this->slugsFor($user);
        $items = collect($recipeIngredients);

        return [
            'matched' => $items->filter(fn ($i) => in_array($i->slug, $have, true))->count(),
            'total' => $items->count(),
            'missing' => $items
                ->reject(fn ($i) => in_array($i->slug, $have, true))
                ->map(fn ($i) => $i->name)
                ->values()
                ->all(),
        ];
    }
}
