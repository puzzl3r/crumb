<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IngredientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'category' => $this->category,
            'default_unit' => $this->default_unit,
            'quantity' => $this->whenPivotLoaded('recipe_ingredient', fn () => (float) $this->pivot->quantity),
            'unit' => $this->whenPivotLoaded('recipe_ingredient', fn () => $this->pivot->unit),
            'note' => $this->whenPivotLoaded('recipe_ingredient', fn () => $this->pivot->note),
            'position' => $this->whenPivotLoaded('recipe_ingredient', fn () => (int) $this->pivot->position),
        ];
    }
}
