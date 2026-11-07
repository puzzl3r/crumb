<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MealPlanEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date' => $this->date->format('Y-m-d'),
            'meal_slot' => $this->meal_slot,
            'status' => $this->status,
            'cooked_at' => $this->cooked_at?->toIso8601String(),
            'servings' => $this->servings,
            'notes' => $this->notes,
            'recipe' => new RecipeResource($this->whenLoaded('recipe')),
        ];
    }
}
