<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\IngredientResource;
use App\Http\Resources\RecipeResource;
use App\Models\Ingredient;
use App\Models\KitchenItem;
use App\Services\RecipeRecommender;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class KitchenController extends Controller
{
    public function __construct(private RecipeRecommender $recommender) {}
    /** GET /api/kitchen */
    public function index(Request $request): JsonResponse
    {
        $items = $request->user()->kitchenItems()->with('ingredient')->get();

        return response()->json([
            'items' => IngredientResource::collection($items->pluck('ingredient')),
            'suggestions' => $this->suggestions($items->pluck('ingredient.slug')->all()),
        ]);
    }

    /** POST /api/kitchen  { name: "Eggs" } */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
        ]);

        $ingredient = Ingredient::resolve($data['name']);

        $item = KitchenItem::firstOrCreate([
            'user_id' => $request->user()->id,
            'ingredient_id' => $ingredient->id,
        ]);

        return response()->json([
            'item' => new IngredientResource($item->ingredient),
            'message' => $item->wasRecentlyCreated
                ? "{$ingredient->name} added to your kitchen."
                : 'You already had that one.',
        ], $item->wasRecentlyCreated ? 201 : 200);
    }

    /** DELETE /api/kitchen/{ingredient} */
    public function destroy(Request $request, Ingredient $ingredient): JsonResponse
    {
        $deleted = $request->user()->kitchenItems()
            ->where('ingredient_id', $ingredient->id)
            ->delete();

        return response()->json([
            'message' => $deleted ? "{$ingredient->name} removed." : 'That was not in your kitchen.',
        ]);
    }

    /**
     * GET /api/kitchen/recipes
     *
     * The "cook with what you have" ranking. Everything visible gets scored
     * against the kitchen (plus any ad-hoc names passed in `q`), then sorted by
     * how many ingredients match, favouring shorter shopping lists on ties.
     */
    public function recipes(Request $request): JsonResponse
    {
        $request->validate(['q' => ['nullable', 'string', 'max:400']]);

        $have = $this->haveSlugs($request);
        $ranked = $this->recommender->rank($request->user(), $have);

        $limit = min(max($request->integer('limit', 12), 1), 40);

        return response()->json([
            'kitchen' => $have,
            'recipes' => $ranked->take($limit)
                ->map(fn (array $row) => [
                    'recipe' => new RecipeResource($row['recipe']),
                    'matched' => $row['matched'],
                    'total' => $row['total'],
                    'percent' => $row['percent'],
                    'missing' => $row['missing'],
                ])
                ->values()
                ->all(),
            'meta' => [
                'candidates' => $ranked->count(),
                'kitchen_size' => count($have),
                'closest_missing' => $this->recommender->mostRequestedMissing($ranked),
            ],
        ]);
    }

    /** @return array<int, string> */
    private function haveSlugs(Request $request): array
    {
        $raw = trim((string) $request->input('q'));

        $typed = $raw === ''
            ? []
            : array_filter(array_map(fn (string $name) => Str::slug($name), preg_split('/[,\n]/', $raw)));

        return $this->recommender->haveSlugs($request->user(), $typed);
    }

    /** @return array<int, string> */
    private function suggestions(array $excludeSlugs): array
    {
        return Ingredient::query()
            ->whereNotIn('slug', $excludeSlugs)
            ->orderBy('name')
            ->limit(8)
            ->pluck('name')
            ->all();
    }
}
