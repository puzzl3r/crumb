<?php

namespace App\Http\Resources;

use App\Services\KitchenSnapshot;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecipeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $match = app(KitchenSnapshot::class)->compare($request->user(), $this->ingredients);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'image_url' => $this->imageUrl(),
            'prep_minutes' => $this->prep_minutes,
            'cook_minutes' => $this->cook_minutes,
            'total_minutes' => $this->totalMinutes(),
            'difficulty' => $this->difficulty,
            'meal_category' => $this->meal_category,
            'cuisine' => $this->cuisine,
            'servings' => $this->servings,
            'calories' => $this->calories,
            'steps' => $this->steps ?? [],
            'dietary_tags' => $this->dietary_tags ?? [],
            'source' => $this->source,
            'is_mine' => $this->ownedBy($request->user()?->id),
            // Shared library recipes (user_id = null) belong to everyone, so any cook may
            // improve or remove one. Deleting a library recipe is global, not per-user.
            'can_edit' => $this->user_id === null || $this->ownedBy($request->user()?->id),
            'can_delete' => $this->user_id === null || $this->ownedBy($request->user()?->id),
            'ingredients' => IngredientResource::collection($this->whenLoaded('ingredients')),
            'ingredient_count' => $this->whenCounted('ingredients'),
            'kitchen_match' => [
                'matched' => $match['matched'],
                'total' => $match['total'],
                'percent' => $match['total'] > 0 ? (int) round($match['matched'] / $match['total'] * 100) : 0,
                'missing' => $match['missing'],
            ],
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner?->id,
                'name' => $this->owner?->name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
