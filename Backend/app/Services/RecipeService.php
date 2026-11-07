<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\Recipe;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RecipeService
{
    /**
     * Persist a recipe plus its ingredient lines and optional photo. Ingredient
     * lines are re-synced wholesale because the editor always submits the full list.
     *
     * @param  array<int, array{name: string, quantity?: numeric|null, unit?: string|null, note?: string|null}>  $ingredients
     */
    public function persist(
        Recipe $recipe,
        array $attributes,
        array $ingredients,
        array $steps,
        ?UploadedFile $image = null,
        bool $removeImage = false,
    ): Recipe {
        $recipe->fill([
            'name' => $attributes['name'],
            'description' => $attributes['description'] ?? null,
            'prep_minutes' => $attributes['prep_minutes'] ?? null,
            'cook_minutes' => $attributes['cook_minutes'] ?? null,
            'difficulty' => $attributes['difficulty'] ?? 'easy',
            'meal_category' => $attributes['meal_category'] ?? null,
            'cuisine' => $attributes['cuisine'] ?? null,
            'servings' => $attributes['servings'] ?? 2,
            'calories' => $attributes['calories'] ?? null,
            'steps' => $this->cleanSteps($steps),
        ]);

        if ($image) {
            if ($recipe->image_path) {
                Storage::disk('public')->delete($recipe->image_path);
            }

            $recipe->image_path = $image->store('recipes', 'public');
        } elseif ($removeImage && $recipe->image_path) {
            Storage::disk('public')->delete($recipe->image_path);
            $recipe->image_path = null;
        }

        $recipe->save();

        $recipe->ingredients()->sync($this->syncIngredients($ingredients));

        return $recipe->load('ingredients');
    }

    /** @return array<int, array<string, mixed>> pivot rows keyed by ingredient id */
    private function syncIngredients(array $lines): array
    {
        $seen = [];
        $rows = [];

        foreach (array_values($lines) as $position => $line) {
            $name = trim($line['name'] ?? '');

            if ($name === '') {
                continue;
            }

            $ingredient = Ingredient::resolve($name);

            // Two lines naming the same ingredient collapse into the first one.
            if (isset($rows[$ingredient->id])) {
                continue;
            }

            $seen[] = $ingredient->id;

            $rows[$ingredient->id] = [
                'quantity' => isset($line['quantity']) && $line['quantity'] !== '' ? (float) $line['quantity'] : null,
                'unit' => filled($line['unit'] ?? null) ? Str::limit(trim($line['unit']), 32, '') : null,
                'note' => filled($line['note'] ?? null) ? Str::limit(trim($line['note']), 120, '') : null,
                'position' => $position,
            ];
        }

        return $rows;
    }

    /** @return array<int, string> */
    private function cleanSteps(array $steps): array
    {
        return collect($steps)
            ->map(fn ($step) => is_array($step) ? ($step['body'] ?? '') : $step)
            ->map(fn ($step) => trim((string) $step))
            ->filter()
            ->values()
            ->all();
    }
}
