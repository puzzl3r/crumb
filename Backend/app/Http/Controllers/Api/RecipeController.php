<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RecipeRequest;
use App\Http\Resources\RecipeResource;
use App\Models\Recipe;
use App\Services\RecipeService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RecipeController extends Controller
{
    public function __construct(private RecipeService $recipes) {}

    /**
     * GET /api/recipes
     *
     * The single entry point for Discover, "Made for your kitchen" and the
     * cook-with-what-you-have search. Filters are all optional.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Recipe::query()
            ->visibleTo($user)
            ->with(['ingredients', 'owner:id,name'])
            ->withCount('ingredients');

        $query->search($request->string('q')->trim()->value());

        if ($difficulty = $request->string('difficulty')->trim()->value()) {
            $query->where('difficulty', $difficulty);
        }

        if ($category = $request->string('category')->trim()->value()) {
            $query->where('meal_category', $category);
        }

        if ($cuisine = $request->string('cuisine')->trim()->value()) {
            $query->where('cuisine', 'like', '%'.$cuisine.'%');
        }

        if ($dietary = $request->string('dietary')->trim()->value()) {
            $query->whereJsonContains('dietary_tags', $dietary);
        }

        if ($max = $this->minutesCeiling($request->string('time')->value())) {
            $query->whereRaw('COALESCE(prep_minutes,0) + COALESCE(cook_minutes,0) <= ?', [$max]);
        }

        $slugs = $this->ingredientSlugs($request);

        if ($slugs !== []) {
            $query->withIngredientSlugs($slugs);
        }

        $this->applySort($query, $request->string('sort')->value());

        $perPage = min(max((int) $request->integer('limit', 12), 1), 60);
        $paginator = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'recipes' => RecipeResource::collection($paginator->items()),
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'last_page' => $paginator->lastPage(),
                'kitchen_size' => count($user->kitchenIngredientSlugs()),
            ],
        ]);
    }

    /** GET /api/recipes/{recipe} */
    public function show(Request $request, Recipe $recipe): JsonResponse
    {
        if ($this->forbidden($request, $recipe)) {
            return $this->forbiddenResponse();
        }

        $recipe->load(['ingredients', 'owner:id,name'])->loadCount('ingredients');

        return response()->json(['recipe' => new RecipeResource($recipe)]);
    }

    /** POST /api/recipes */
    public function store(RecipeRequest $request): JsonResponse
    {
        $recipe = $request->user()->recipes()->create([
            'source' => 'own',
            'name' => $request->validated('name'),
        ]);

        $recipe = $this->recipes->persist(
            $recipe,
            $request->safe()->except(['image', 'remove_image', 'ingredients', 'steps']),
            $request->validated('ingredients'),
            $request->validated('steps'),
            $request->file('image'),
            (bool) $request->boolean('remove_image'),
        );

        return response()->json([
            'recipe' => new RecipeResource($recipe->loadCount('ingredients')),
            'message' => 'Recipe saved.',
        ], 201);
    }

    /** PUT /api/recipes/{recipe} */
    public function update(RecipeRequest $request, Recipe $recipe): JsonResponse
    {
        $recipe = $this->recipes->persist(
            $recipe,
            $request->safe()->except(['image', 'remove_image', 'ingredients', 'steps']),
            $request->validated('ingredients'),
            $request->validated('steps'),
            $request->file('image'),
            (bool) $request->boolean('remove_image'),
        );

        return response()->json([
            'recipe' => new RecipeResource($recipe->loadCount('ingredients')),
            'message' => 'Recipe updated.',
        ]);
    }

    /** DELETE /api/recipes/{recipe} */
    public function destroy(Request $request, Recipe $recipe): JsonResponse
    {
        // Library recipes (user_id = null) are deletable like any other, but the cascade
        // removes them for every cook, so the frontend warns before it asks.
        if ($this->forbidden($request, $recipe)) {
            return $this->forbiddenResponse();
        }

        $recipe->delete();

        return response()->json(['message' => 'Recipe deleted.']);
    }

    /** GET /api/recipes/mine — the "My Recipes" collection. */
    public function mine(Request $request): JsonResponse
    {
        $recipes = Recipe::query()
            ->owning($request->user())
            ->search($request->string('q')->trim()->value())
            ->with(['ingredients'])
            ->withCount('ingredients')
            ->latest('updated_at')
            ->get();

        return response()->json([
            'recipes' => RecipeResource::collection($recipes),
            'meta' => ['total' => $recipes->count()],
        ]);
    }

    private function forbidden(Request $request, Recipe $recipe): bool
    {
        return $recipe->user_id !== null && $recipe->user_id !== $request->user()->id;
    }

    private function forbiddenResponse(): JsonResponse
    {
        return response()->json(['message' => 'You can only change recipes you added yourself.'], Response::HTTP_FORBIDDEN);
    }

    private function minutesCeiling(?string $preference): ?int
    {
        return [
            'under_15' => 15,
            'under_30' => 30,
            'under_45' => 45,
            'under_60' => 60,
        ][$preference] ?? null;
    }

    /** @return array<int, string> */
    private function ingredientSlugs(Request $request): array
    {
        $raw = $request->string('ingredients')->trim()->value();

        if ($raw === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $raw))));
    }

    private function applySort(Builder $query, ?string $sort): void
    {
        match ($sort) {
            'quick' => $query->orderByRaw('COALESCE(prep_minutes,0) + COALESCE(cook_minutes,0)'),
            'recent' => $query->latest('created_at'),
            'name' => $query->orderBy('name'),
            default => $query->latest('updated_at'),
        };
    }
}
