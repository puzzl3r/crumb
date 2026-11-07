<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class IngredientSeeder extends Seeder
{
    /**
     * [name, category, default_unit] — the catalogue every recipe and kitchen
     * chip resolves against, so "Eggs" and "eggs" are the same thing.
     */
    public const CATALOGUE = [
        ['Eggs', 'dairy', 'pieces'],
        ['Milk', 'dairy', 'cup'],
        ['Butter', 'dairy', 'tbsp'],
        ['Cheese', 'dairy', 'cup'],
        ['Parmesan', 'dairy', 'tbsp'],
        ['Heavy cream', 'dairy', 'cup'],
        ['Condensed milk', 'pantry', 'can'],
        ['Yogurt', 'dairy', 'cup'],
        ['Tomato', 'produce', 'pieces'],
        ['Onion', 'produce', 'pieces'],
        ['Green onion', 'produce', 'pieces'],
        ['Spinach', 'produce', 'cup'],
        ['Ginger', 'produce', 'tsp'],
        ['Garlic', 'produce', 'cloves'],
        ['Carrot', 'produce', 'pieces'],
        ['Broccoli', 'produce', 'cup'],
        ['Bell pepper', 'produce', 'pieces'],
        ['Zucchini', 'produce', 'pieces'],
        ['Potato', 'produce', 'pieces'],
        ['Sweet potato', 'produce', 'pieces'],
        ['Corn', 'produce', 'cup'],
        ['Mushroom', 'produce', 'cup'],
        ['Lemon', 'produce', 'pieces'],
        ['Lime', 'produce', 'pieces'],
        ['Avocado', 'produce', 'pieces'],
        ['Cucumber', 'produce', 'pieces'],
        ['Red onion', 'produce', 'pieces'],
        ['Herbs', 'produce', 'tbsp'],
        ['Banana', 'produce', 'pieces'],
        ['Blueberry', 'produce', 'cup'],
        ['Pasta', 'pantry', 'g'],
        ['Rice', 'pantry', 'cup'],
        ['Flour', 'pantry', 'cup'],
        ['Oats', 'pantry', 'cup'],
        ['Bread', 'pantry', 'slices'],
        ['Chickpeas', 'pantry', 'can'],
        ['Black beans', 'pantry', 'can'],
        ['Quinoa', 'pantry', 'cup'],
        ['Olive oil', 'pantry', 'tbsp'],
        ['Soy sauce', 'pantry', 'tbsp'],
        ['Sesame oil', 'pantry', 'tsp'],
        ['Honey', 'pantry', 'tbsp'],
        ['Sugar', 'pantry', 'tbsp'],
        ['Vanilla', 'pantry', 'tsp'],
        ['Salt', 'pantry', 'tsp'],
        ['Pepper', 'pantry', 'tsp'],
        ['Paprika', 'pantry', 'tsp'],
        ['Cumin', 'pantry', 'tsp'],
        ['Curry powder', 'pantry', 'tsp'],
        ['Chicken breast', 'protein', 'pieces'],
        ['Chicken thigh', 'protein', 'pieces'],
        ['Beef', 'protein', 'g'],
        ['Pork', 'protein', 'g'],
        ['Shrimp', 'protein', 'g'],
        ['Tofu', 'protein', 'block'],
        ['Salmon', 'protein', 'fillet'],
        ['Thyme', 'produce', 'tsp'],
        ['Rosemary', 'produce', 'tsp'],
        ['Basil', 'produce', 'leaves'],
        ['Parsley', 'produce', 'tbsp'],
    ];

    public function run(): void
    {
        foreach (self::CATALOGUE as [$name, $category, $unit]) {
            Ingredient::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'category' => $category, 'default_unit' => $unit],
            );
        }
    }
}
