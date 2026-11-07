<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\KitchenItem;
use App\Models\MealPlanEntry;
use App\Models\Recipe;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(IngredientSeeder::class);
        $this->call(RecipeSeeder::class);

        $library = Recipe::whereNull('user_id')->pluck('id', 'name');

        $this->cook(
            name: 'Archer Bennett',
            email: 'archer.bennett@gmail.com',
            kitchen: ['Eggs', 'Tomato', 'Milk', 'Butter', 'Onion', 'Spinach', 'Ginger'],
            library: $library,
            ownRecipes: $this->ownRecipes(),
            plan: [
                ['offset' => 0, 'slot' => 'lunch', 'name' => 'Creamy garlic pasta'],
                ['offset' => 1, 'slot' => 'lunch', 'name' => 'Roasted veggie bowl'],
                ['offset' => 3, 'slot' => 'dinner', 'name' => 'Herby chicken rice'],
                ['offset' => 4, 'slot' => 'dinner', 'name' => 'Egg fried rice'],
                ['offset' => 6, 'slot' => 'breakfast', 'name' => 'Tomato omelette', 'status' => 'cooked'],
            ],
        );

        $this->cook(
            name: 'Jules Alvarez',
            email: 'jules@crumb.test',
            kitchen: ['Rice', 'Chicken breast', 'Soy sauce', 'Broccoli'],
            library: $library,
            ownRecipes: [],
            plan: [
                ['offset' => 2, 'slot' => 'dinner', 'name' => 'Chicken veggie stir fry'],
            ],
        );

        $this->command?->info(sprintf(
            'Seeded %d cooks, %d library recipes, %d planned meals.',
            User::count(),
            Recipe::whereNull('user_id')->count(),
            MealPlanEntry::count(),
        ));
    }

    /** @param  \Illuminate\Support\Collection<string, int>  $library */
    private function cook(string $name, string $email, array $kitchen, $library, array $ownRecipes, array $plan): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => 'password123',
                'email_verified_at' => now(),
                'dietary_preference' => 'vegetarian',
                'household_size' => 2,
                'default_servings' => 2,
                'cooking_time_preference' => 'under_30',
                'measurement_unit' => 'metric',
            ]
        );

        foreach ($kitchen as $itemName) {
            $ingredient = Ingredient::firstOrCreate(['slug' => Str::slug($itemName)], ['name' => $itemName]);

            KitchenItem::firstOrCreate([
                'user_id' => $user->id,
                'ingredient_id' => $ingredient->id,
            ]);
        }

        foreach ($ownRecipes as $data) {
            $this->ownRecipe($user, $data);
        }

        $weekStart = CarbonImmutable::now()->startOfWeek();

        foreach ($plan as $item) {
            $recipeId = $library[$item['name']] ?? null;

            if (! $recipeId) {
                continue;
            }

            $date = $weekStart->addDays($item['offset'])->toDateString();

            $cooked = ($item['status'] ?? 'planned') === MealPlanEntry::STATUS_COOKED;

            MealPlanEntry::firstOrCreate(
                ['user_id' => $user->id, 'date' => $date, 'meal_slot' => $item['slot'], 'recipe_id' => $recipeId],
                [
                    'status' => $cooked ? MealPlanEntry::STATUS_COOKED : MealPlanEntry::STATUS_PLANNED,
                    'cooked_at' => $cooked ? $weekStart->addDays($item['offset']) : null,
                    'servings' => 2,
                ]
            );
        }

        return $user;
    }

    /** @return array<int, array<string, mixed>> */
    private function ownRecipes(): array
    {
        return [
            [
                'name' => 'Weeknight miso eggs',
                'description' => 'Soft eggs in a quick miso broth. The thing I make when the fridge looks empty.',
                'prep' => 5, 'cook' => 10, 'difficulty' => 'easy', 'category' => 'dinner',
                'cuisine' => 'Japanese', 'servings' => 2,
                'steps' => [
                    'Warm the broth and stir the miso through off the heat.',
                    'Poach the eggs for three minutes, then rest on paper.',
                    'Slide an egg into each bowl and finish with green onion.',
                ],
                'ingredients' => [
                    ['Eggs', 2, 'pieces'], ['Milk', 0.5, 'cup'], ['Onion', 0.5, 'pieces'],
                ],
            ],
            [
                'name' => 'Charred tomato pasta',
                'description' => 'Tomatoes cooked until they collapse, then tossed through whatever pasta is open.',
                'prep' => 8, 'cook' => 18, 'difficulty' => 'easy', 'category' => 'lunch',
                'cuisine' => 'Italian', 'servings' => 2,
                'steps' => [
                    'Roast the tomatoes with olive oil until the skins blister.',
                    'Cook the pasta, reserving a cup of the water.',
                    'Crush the tomatoes into the pan and emulsify with pasta water.',
                ],
                'ingredients' => [
                    ['Tomato', 4, 'pieces'], ['Pasta', 200, 'g'], ['Onion', 1, 'pieces'], ['Spinach', 1, 'cup'],
                ],
            ],
        ];
    }

    private function ownRecipe(User $user, array $data): Recipe
    {
        $recipe = Recipe::firstOrCreate(
            ['user_id' => $user->id, 'name' => $data['name']],
            [
                'description' => $data['description'],
                'image_path' => 'recipes/'.Str::slug($data['name']).'.jpg',
                'prep_minutes' => $data['prep'],
                'cook_minutes' => $data['cook'],
                'difficulty' => $data['difficulty'],
                'meal_category' => $data['category'],
                'cuisine' => $data['cuisine'],
                'servings' => $data['servings'],
                'steps' => $data['steps'],
                'dietary_tags' => ['vegetarian'],
                'source' => 'own',
            ]
        );

        $rows = [];

        foreach ($data['ingredients'] as $position => [$itemName, $quantity, $unit]) {
            $ingredient = Ingredient::firstOrCreate(['slug' => Str::slug($itemName)], ['name' => $itemName]);

            $rows[$ingredient->id] = ['quantity' => $quantity, 'unit' => $unit, 'position' => $position];
        }

        $recipe->ingredients()->sync($rows);

        return $recipe;
    }
}
