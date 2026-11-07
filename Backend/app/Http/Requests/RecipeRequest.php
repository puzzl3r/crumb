<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecipeRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:600'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_image' => ['nullable', 'boolean'],
            'prep_minutes' => ['nullable', 'integer', 'min:0', 'max:600'],
            'cook_minutes' => ['nullable', 'integer', 'min:0', 'max:600'],
            'difficulty' => ['nullable', Rule::in(config('crumb.difficulties'))],
            'meal_category' => ['nullable', Rule::in(config('crumb.categories'))],
            'cuisine' => ['nullable', 'string', 'max:64'],
            'servings' => ['nullable', 'integer', 'min:1', 'max:24'],
            'calories' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'steps' => ['present', 'array', 'min:1', 'max:40'],
            'steps.*' => ['required', 'string', 'max:500'],
            'ingredients' => ['present', 'array', 'min:1', 'max:60'],
            'ingredients.*.name' => ['required', 'string', 'max:80'],
            'ingredients.*.quantity' => ['nullable', 'numeric', 'min:0', 'max:9999'],
            'ingredients.*.unit' => ['nullable', 'string', 'max:32'],
            'ingredients.*.note' => ['nullable', 'string', 'max:120'],
        ];
    }

    public function messages(): array
    {
        return [
            'ingredients.min' => 'Add at least one ingredient so we can match this to your kitchen.',
            'steps.min' => 'Add at least one cooking step.',
        ];
    }
}
