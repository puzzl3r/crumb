<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\Recipe;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * The shared recipe library (user_id = null means "everyone can cook it").
 * Mirrors the dishes from the Crumb mockups so the app looks lived-in on first run.
 */
class RecipeSeeder extends Seeder
{
    public const RECIPES = [
        [
            'name' => 'Creamy garlic pasta',
            'description' => 'Silky, garlicky and ready before the pasta water cools. A favourite for simple, comforting home cooking.',
            'image' => 'creamy-garlic-pasta',
            'prep' => 10, 'cook' => 15, 'difficulty' => 'easy', 'category' => 'dinner',
            'cuisine' => 'Italian', 'servings' => 2, 'calories' => 520,
            'tags' => ['vegetarian'],
            'steps' => [
                'Bring a large pot of salted water to the boil and cook the pasta until just tender.',
                'Gently melt the butter with the sliced garlic until fragrant, about two minutes.',
                'Loosen with a ladle of pasta water, then fold in the cream and parmesan.',
                'Toss through the drained pasta and finish with black pepper and parsley.',
            ],
            'ingredients' => [
                ['Pasta', 200, 'g'], ['Garlic', 3, 'cloves'], ['Heavy cream', 0.5, 'cup'],
                ['Butter', 2, 'tbsp'], ['Parmesan', 3, 'tbsp'],
            ],
        ],
        [
            'name' => 'Roasted veggie bowl',
            'description' => 'Deeply caramelised vegetables over grains, with whatever is closest to the front of the drawer.',
            'image' => 'roasted-veggie-bowl',
            'prep' => 10, 'cook' => 20, 'difficulty' => 'easy', 'category' => 'lunch',
            'cuisine' => 'Mediterranean', 'servings' => 2, 'calories' => 430,
            'tags' => ['vegetarian', 'vegan', 'gluten_free'],
            'steps' => [
                'Heat the oven to 220°C and line a tray with parchment.',
                'Toss the vegetables in olive oil, salt and paprika, then roast for 20 minutes.',
                'Fluff the quinoa and spoon it into two bowls.',
                'Pile the roasted vegetables on top and finish with a squeeze of lemon.',
            ],
            'ingredients' => [
                ['Broccoli', 1.5, 'cup'], ['Bell pepper', 1, 'pieces'], ['Carrot', 2, 'pieces'],
                ['Quinoa', 1, 'cup'], ['Olive oil', 2, 'tbsp'],
            ],
        ],
        [
            'name' => 'Herby chicken rice',
            'description' => 'One pot, two main ingredients, and a kitchen that smells like Sunday.',
            'image' => 'herby-chicken-rice',
            'prep' => 10, 'cook' => 25, 'difficulty' => 'medium', 'category' => 'dinner',
            'cuisine' => 'Levantine', 'servings' => 2, 'calories' => 560,
            'tags' => ['gluten_free'],
            'steps' => [
                'Season the chicken and sear it in the pot until golden on both sides.',
                'Add the rice and toast it in the fat for a minute.',
                'Pour in stock, cover and simmer for 18 minutes without lifting the lid.',
                'Rest for five, then fold through the herbs and fluff with a fork.',
            ],
            'ingredients' => [
                ['Chicken breast', 2, 'pieces'], ['Rice', 1, 'cup'],
                ['Herbs', 2, 'tbsp'], ['Olive oil', 1, 'tbsp'],
            ],
        ],
        [
            'name' => 'Egg fried rice',
            'description' => 'The fastest dinner in the house, and the best use for yesterday\'s rice.',
            'image' => 'egg-fried-rice',
            'prep' => 5, 'cook' => 10, 'difficulty' => 'easy', 'category' => 'dinner',
            'cuisine' => 'Chinese', 'servings' => 2, 'calories' => 480,
            'tags' => ['vegetarian'],
            'steps' => [
                'Scramble the eggs in a hot wok, then tip them out and set aside.',
                'Add a little more oil, then the cold rice. Break it up and let it fry.',
                'Return the eggs with the soy sauce and green onion, and toss everything together.',
            ],
            'ingredients' => [
                ['Rice', 2, 'cup'], ['Eggs', 2, 'pieces'], ['Soy sauce', 1, 'tbsp'],
                ['Green onion', 2, 'pieces'], ['Pea', 0.5, 'cup'],
            ],
        ],
        [
            'name' => 'Tomato omelette',
            'description' => 'Twelve minutes from pan to plate. The breakfast that never needs a recipe.',
            'image' => 'tomato-omelette',
            'prep' => 3, 'cook' => 9, 'difficulty' => 'easy', 'category' => 'breakfast',
            'cuisine' => 'French', 'servings' => 1, 'calories' => 300,
            'tags' => ['vegetarian', 'gluten_free'],
            'steps' => [
                'Beat the eggs with milk, salt and pepper until just combined.',
                'Melt butter in a non-stick pan over medium heat.',
                'Pour in the eggs, scatter the tomato, and fold when the base sets.',
            ],
            'ingredients' => [
                ['Eggs', 3, 'pieces'], ['Tomato', 1, 'pieces'], ['Butter', 1, 'tbsp'], ['Milk', 2, 'tbsp'],
            ],
        ],
        [
            'name' => 'Vegetable omelette',
            'description' => 'An omelette that quietly empties the salad drawer.',
            'image' => 'vegetable-omelette',
            'prep' => 5, 'cook' => 10, 'difficulty' => 'easy', 'category' => 'breakfast',
            'cuisine' => 'Continental', 'servings' => 1, 'calories' => 340,
            'tags' => ['vegetarian', 'gluten_free'],
            'steps' => [
                'Soften the spinach, onion and tomato in butter for three minutes.',
                'Pour over the beaten eggs and shake the pan so it spreads evenly.',
                'Scatter cheese, fold in half and slide onto a warm plate.',
            ],
            'ingredients' => [
                ['Eggs', 3, 'pieces'], ['Milk', 2, 'tbsp'], ['Spinach', 1, 'cup'],
                ['Tomato', 1, 'pieces'], ['Onion', 0.5, 'pieces'], ['Cheese', 0.25, 'cup'],
            ],
        ],
        [
            'name' => 'Banana pancakes',
            'description' => 'Naturally sweet from very ripe bananas — the weekend morning default.',
            'image' => 'banana-pancakes',
            'prep' => 8, 'cook' => 12, 'difficulty' => 'easy', 'category' => 'breakfast',
            'cuisine' => 'American', 'servings' => 2, 'calories' => 390,
            'tags' => ['vegetarian'],
            'steps' => [
                'Mash the banana, then whisk in egg, milk and melted butter.',
                'Fold in the flour until just combined; lumps are fine.',
                'Cook small rounds in a dry pan until bubbles pop, then flip once.',
                'Stack them up and finish with honey.',
            ],
            'ingredients' => [
                ['Banana', 1, 'pieces'], ['Eggs', 1, 'pieces'], ['Milk', 0.25, 'cup'],
                ['Flour', 0.5, 'cup'], ['Butter', 1, 'tbsp'], ['Honey', 1, 'tbsp'],
            ],
        ],
        [
            'name' => 'Spinach frittata bites',
            'description' => 'Egg muffins for the fridge door — grab two on the way out.',
            'image' => 'spinach-frittata-bites',
            'prep' => 10, 'cook' => 15, 'difficulty' => 'easy', 'category' => 'snack',
            'cuisine' => 'Italian', 'servings' => 4, 'calories' => 180,
            'tags' => ['vegetarian', 'gluten_free'],
            'steps' => [
                'Warm the oven to 180°C and grease a muffin tin.',
                'Whisk eggs with milk, salt and pepper, then stir in spinach and tomato.',
                'Divide between the cups, scatter cheese on top and bake for 15 minutes.',
            ],
            'ingredients' => [
                ['Eggs', 6, 'pieces'], ['Spinach', 1, 'cup'], ['Tomato', 1, 'pieces'],
                ['Cheese', 0.5, 'cup'], ['Milk', 0.25, 'cup'],
            ],
        ],
        [
            'name' => 'Leche flan',
            'description' => 'Slow-set custard over dark caramel. Worth the wait, worth the fridge space.',
            'image' => 'leche-flan',
            'prep' => 15, 'cook' => 45, 'difficulty' => 'medium', 'category' => 'dessert',
            'cuisine' => 'Filipino', 'servings' => 8, 'calories' => 260,
            'tags' => ['vegetarian', 'gluten_free'],
            'steps' => [
                'Melt the sugar to a deep amber and swirl it into the mould.',
                'Whisk yolks with condensed milk and vanilla until completely smooth.',
                'Strain into the mould, cover, and steam in a water bath for 45 minutes.',
                'Chill overnight, then run a knife around the edge to turn it out.',
            ],
            'ingredients' => [
                ['Eggs', 6, 'pieces'], ['Condensed milk', 1, 'can'],
                ['Sugar', 0.5, 'cup'], ['Vanilla', 1, 'tsp'],
            ],
        ],
        [
            'name' => 'Chicken veggie stir fry',
            'description' => 'High heat, short time, and dinner is on the table.',
            'image' => 'chicken-veggie-stir-fry',
            'prep' => 10, 'cook' => 10, 'difficulty' => 'easy', 'category' => 'dinner',
            'cuisine' => 'Thai', 'servings' => 2, 'calories' => 410,
            'tags' => ['dairy_free', 'gluten_free'],
            'steps' => [
                'Slice the chicken thin and let it come to room temperature.',
                'Sear hard in a smoking wok, then push to one side and add the vegetables.',
                'Glaze with soy and sesame, toss once, and serve straight away.',
            ],
            'ingredients' => [
                ['Chicken breast', 2, 'pieces'], ['Broccoli', 1, 'cup'],
                ['Bell pepper', 1, 'pieces'], ['Ginger', 1, 'tsp'], ['Soy sauce', 2, 'tbsp'],
            ],
        ],
        [
            'name' => 'Ginger chicken soup',
            'description' => 'The remedy your grandmother reached for, made in thirty minutes flat.',
            'image' => 'ginger-chicken-soup',
            'prep' => 10, 'cook' => 25, 'difficulty' => 'easy', 'category' => 'lunch',
            'cuisine' => 'Chinese', 'servings' => 3, 'calories' => 250,
            'tags' => ['dairy_free', 'gluten_free'],
            'steps' => [
                'Cover the chicken with cold water, add ginger, and bring barely to a simmer.',
                'Skim as it comes up, then cook gently for 20 minutes.',
                'Shred the chicken, season the broth, and finish with green onion.',
            ],
            'ingredients' => [
                ['Chicken thigh', 3, 'pieces'], ['Ginger', 2, 'tsp'],
                ['Green onion', 2, 'pieces'], ['Carrot', 1, 'pieces'],
            ],
        ],
        [
            'name' => 'Chickpea tomato stew',
            'description' => 'Pantry dinner with a long, lazy simmer and warm bread alongside.',
            'image' => 'chickpea-tomato-stew',
            'prep' => 8, 'cook' => 25, 'difficulty' => 'easy', 'category' => 'dinner',
            'cuisine' => 'Moroccan', 'servings' => 4, 'calories' => 360,
            'tags' => ['vegan', 'vegetarian', 'dairy_free'],
            'steps' => [
                'Soften onion with cumin and paprika in olive oil.',
                'Add tomato and both cans of chickpeas with their liquid.',
                'Simmer 20 minutes until glossy, then season well and serve with bread.',
            ],
            'ingredients' => [
                ['Chickpeas', 2, 'can'], ['Tomato', 3, 'pieces'], ['Onion', 1, 'pieces'],
                ['Cumin', 1, 'tsp'], ['Olive oil', 2, 'tbsp'],
            ],
        ],
    ];

    public function run(): void
    {
        foreach (self::RECIPES as $data) {
            $recipe = Recipe::firstOrCreate(
                ['name' => $data['name'], 'user_id' => null],
                [
                    'description' => $data['description'],
                    'image_path' => 'recipes/'.$data['image'].'.jpg',
                    'prep_minutes' => $data['prep'],
                    'cook_minutes' => $data['cook'],
                    'difficulty' => $data['difficulty'],
                    'meal_category' => $data['category'],
                    'cuisine' => $data['cuisine'],
                    'servings' => $data['servings'],
                    'calories' => $data['calories'],
                    'steps' => $data['steps'],
                    'dietary_tags' => $data['tags'],
                    'source' => 'community',
                ]
            );

            $rows = [];

            foreach ($data['ingredients'] as $position => [$name, $quantity, $unit]) {
                $ingredient = Ingredient::firstOrCreate(
                    ['slug' => Str::slug($name)],
                    ['name' => $name]
                );

                $rows[$ingredient->id] = [
                    'quantity' => $quantity,
                    'unit' => $unit,
                    'position' => $position,
                ];
            }

            $recipe->ingredients()->sync($rows);
        }
    }
}
