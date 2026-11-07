<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MealPlanEntryResource;
use App\Http\Resources\RecipeResource;
use App\Models\MealPlanEntry;
use App\Models\Recipe;
use App\Services\RecipeRecommender;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private RecipeRecommender $recommender) {}

    /** GET /api/dashboard */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = CarbonImmutable::today();
        $weekStart = $today->startOfWeek();
        $weekEnd = $weekStart->addDays(6);

        $weekEntries = MealPlanEntry::query()
            ->where('user_id', $user->id)
            ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->with(['recipe.ingredients'])
            ->orderBy('date')
            ->get();

        return response()->json([
            'greeting' => $this->greeting(),
            'first_name' => str($user->name)->before(' '),
            'today' => [
                'date' => $today->toDateString(),
                'label' => $today->format('l, j F'),
                'entries' => MealPlanEntryResource::collection(
                    $weekEntries->where('date', $today->toDateString())->values()
                )->resolve(),
            ],
            'suggestions' => $this->suggestions($request),
            'coming_up' => $this->comingUp($weekEntries, $today),
            'stats' => [
                'planned_this_week' => $weekEntries->where('status', MealPlanEntry::STATUS_PLANNED)->count(),
                'cooked_this_week' => $weekEntries->where('status', MealPlanEntry::STATUS_COOKED)->count(),
                'kitchen_items' => $user->kitchenItems()->count(),
                'my_recipes' => Recipe::owning($user)->count(),
            ],
            'needs_attention' => [
                'kitchen_is_empty' => $user->kitchenItems()->count() === 0,
                'no_recipes' => Recipe::owning($user)->count() === 0,
                'nothing_planned' => $weekEntries->isEmpty(),
            ],
        ]);
    }

    /**
     * Best kitchen matches first. A brand-new cook has an empty kitchen, so fall
     * back to the fastest recipes rather than showing a blank strip.
     */
    private function suggestions(Request $request): array
    {
        $ranked = $this->recommender->rank($request->user());

        if ($ranked->isEmpty()) {
            $fallback = Recipe::query()
                ->visibleTo($request->user())
                ->with('ingredients')
                ->orderByRaw('COALESCE(prep_minutes,0) + COALESCE(cook_minutes,0)')
                ->limit(3)
                ->get();

            return $fallback->map(fn (Recipe $recipe) => [
                'recipe' => new RecipeResource($recipe),
                'matched' => 0,
                'total' => $recipe->ingredients->count(),
                'percent' => 0,
                'missing' => $recipe->ingredients->pluck('name')->all(),
            ])->all();
        }

        return $ranked->take(3)
            ->map(fn (array $row) => [
                'recipe' => new RecipeResource($row['recipe']),
                'matched' => $row['matched'],
                'total' => $row['total'],
                'percent' => $row['percent'],
                'missing' => $row['missing'],
            ])
            ->all();
    }

    /** The next five days, labelled with whatever is planned for each. */
    private function comingUp($weekEntries, CarbonImmutable $today): array
    {
        return collect(range(0, 4))
            ->map(function (int $offset) use ($weekEntries, $today) {
                $day = $today->addDays($offset);
                $key = $day->toDateString();

                $entry = $weekEntries
                    ->filter(fn (MealPlanEntry $e) => $e->date->format('Y-m-d') === $key)
                    ->sortBy(fn (MealPlanEntry $e) => array_search($e->meal_slot, config('crumb.meal_slots')))
                    ->first();

                return [
                    'date' => $key,
                    'day' => strtoupper($day->format('D')),
                    'day_number' => (int) $day->format('j'),
                    'is_today' => $offset === 0,
                    'meal' => $entry?->recipe?->name,
                    'meal_slot' => $entry?->meal_slot,
                    'status' => $entry?->status,
                ];
            })
            ->all();
    }

    private function greeting(): string
    {
        $hour = (int) now()->format('G');

        return match (true) {
            $hour < 12 => 'Good morning',
            $hour < 17 => 'Good afternoon',
            default => 'Good evening',
        };
    }
}
