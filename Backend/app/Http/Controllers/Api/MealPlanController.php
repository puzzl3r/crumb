<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MealPlanEntryResource;
use App\Models\MealPlanEntry;
use App\Models\Recipe;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MealPlanController extends Controller
{
    /** GET /api/meal-plan?week_start=2026-10-19 */
    public function index(Request $request): JsonResponse
    {
        $request->validate(['week_start' => ['nullable', 'date_format:Y-m-d']]);

        $start = $request->filled('week_start')
            ? CarbonImmutable::parse($request->week_start)->startOfWeek()
            : CarbonImmutable::now()->startOfWeek();

        $end = $start->addDays(6);

        $entries = MealPlanEntry::query()
            ->where('user_id', $request->user()->id)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->with(['recipe.ingredients', 'recipe.owner:id,name'])
            ->orderBy('date')
            ->get();

        return response()->json([
            'week' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
                'label' => $start->format('F j').' – '.$end->format('j, Y'),
            ],
            'days' => $this->emptyWeekGrid($start, $entries),
            'summary' => [
                'planned' => $entries->where('status', MealPlanEntry::STATUS_PLANNED)->count(),
                'cooked' => $entries->where('status', MealPlanEntry::STATUS_COOKED)->count(),
            ],
        ]);
    }

    /** POST /api/meal-plan */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recipe_id' => ['required', 'integer', Rule::exists('recipes', 'id')],
            'date' => ['required', 'date_format:Y-m-d'],
            'meal_slot' => ['required', Rule::in(config('crumb.meal_slots'))],
            'servings' => ['nullable', 'integer', 'min:1', 'max:24'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $recipe = Recipe::visibleTo($request->user())->findOrFail($data['recipe_id']);

        $duplicate = MealPlanEntry::query()
            ->where('user_id', $request->user()->id)
            ->where('date', $data['date'])
            ->where('meal_slot', $data['meal_slot'])
            ->where('recipe_id', $recipe->id)
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => "{$recipe->name} is already in that slot.",
            ], 422);
        }

        $entry = MealPlanEntry::create([
            'user_id' => $request->user()->id,
            'recipe_id' => $recipe->id,
            'date' => $data['date'],
            'meal_slot' => $data['meal_slot'],
            'servings' => $data['servings'] ?? $recipe->servings,
            'notes' => $data['notes'] ?? null,
            'status' => MealPlanEntry::STATUS_PLANNED,
        ]);

        return response()->json([
            'entry' => new MealPlanEntryResource($entry->load(['recipe.ingredients'])),
            'message' => "{$recipe->name} added to your plan.",
        ], 201);
    }

    /** PUT /api/meal-plan/{entry} */
    public function update(Request $request, MealPlanEntry $entry): JsonResponse
    {
        $this->authorizeEntry($request, $entry);

        $data = $request->validate([
            'date' => ['sometimes', 'date_format:Y-m-d'],
            'meal_slot' => ['sometimes', Rule::in(config('crumb.meal_slots'))],
            'status' => ['sometimes', Rule::in([MealPlanEntry::STATUS_PLANNED, MealPlanEntry::STATUS_COOKED])],
            'servings' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:24'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        if (array_key_exists('status', $data)) {
            $data['cooked_at'] = $data['status'] === MealPlanEntry::STATUS_COOKED ? now() : null;
        }

        $entry->update($data);

        return response()->json([
            'entry' => new MealPlanEntryResource($entry->load(['recipe.ingredients'])),
            'message' => $entry->isCooked() ? 'Nice — marked as cooked.' : 'Updated.',
        ]);
    }

    /** DELETE /api/meal-plan/{entry} */
    public function destroy(Request $request, MealPlanEntry $entry): JsonResponse
    {
        $this->authorizeEntry($request, $entry);

        $entry->delete();

        return response()->json(['message' => 'Removed from your plan.']);
    }

    /**
     * Seven days, each with its four slots, so the grid renders even when the
     * week is completely empty.
     */
    private function emptyWeekGrid(CarbonImmutable $start, $entries): array
    {
        $slots = config('crumb.meal_slots');
        $today = CarbonImmutable::today()->toDateString();
        $byDate = $entries->groupBy(fn (MealPlanEntry $e) => $e->date->format('Y-m-d'));

        return collect(range(0, 6))
            ->map(function (int $offset) use ($start, $byDate, $slots, $today) {
                $day = $start->addDays($offset);
                $key = $day->toDateString();
                $forDay = $byDate->get($key, collect());

                return [
                    'date' => $key,
                    'is_today' => $key === $today,
                    'label' => $day->format('D'),
                    'day_number' => (int) $day->format('j'),
                    'month' => $day->format('M'),
                    'slots' => collect($slots)
                        ->mapWithKeys(fn (string $slot) => [
                            $slot => MealPlanEntryResource::collection(
                                $forDay->where('meal_slot', $slot)->values()
                            )->resolve(),
                        ])
                        ->all(),
                ];
            })
            ->all();
    }

    private function authorizeEntry(Request $request, MealPlanEntry $entry): void
    {
        abort_unless($entry->user_id === $request->user()->id, 403, 'That plan is not yours.');
    }
}
