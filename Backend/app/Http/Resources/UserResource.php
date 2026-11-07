<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'first_name' => str_contains($this->name, ' ') ? str($this->name)->before(' ') : $this->name,
            'avatar_url' => $this->avatarUrl(),
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'dietary_preference' => $this->dietary_preference,
            'allergies' => $this->allergies ?? [],
            'household_size' => $this->household_size,
            'default_servings' => $this->default_servings,
            'cooking_time_preference' => $this->cooking_time_preference,
            'measurement_unit' => $this->measurement_unit,
            'notifications' => [
                'meal_reminders' => (bool) $this->notify_meal_reminders,
                'weekly_inspiration' => (bool) $this->notify_weekly_inspiration,
                'product_news' => (bool) $this->notify_product_news,
            ],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
