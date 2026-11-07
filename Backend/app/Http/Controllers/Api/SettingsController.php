<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
    /** GET /api/settings */
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
            'devices' => $this->devices($request),
            'counts' => [
                'recipes' => $request->user()->recipes()->count(),
                'kitchen_items' => $request->user()->kitchenItems()->count(),
            ],
        ]);
    }

    /** PUT /api/settings */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:120'],
            'email' => ['sometimes', 'email', 'max:191', 'unique:users,email,'.$user->id],
            'dietary_preference' => ['sometimes', 'in:'.implode(',', config('crumb.dietary_preferences'))],
            'allergies' => ['sometimes', 'nullable', 'array', 'max:20'],
            'allergies.*' => ['string', 'max:60'],
            'household_size' => ['sometimes', 'integer', 'min:1', 'max:12'],
            'default_servings' => ['sometimes', 'integer', 'min:1', 'max:24'],
            'cooking_time_preference' => ['sometimes', 'in:'.implode(',', config('crumb.time_preferences'))],
            'measurement_unit' => ['sometimes', 'in:'.implode(',', config('crumb.measurement_units'))],
            'notifications.meal_reminders' => ['sometimes', 'boolean'],
            'notifications.weekly_inspiration' => ['sometimes', 'boolean'],
            'notifications.product_news' => ['sometimes', 'boolean'],
        ]);

        $user->fill(collect($data)->except('notifications')->all());

        if (isset($data['email']) && ! hash_equals(mb_strtolower($user->getOriginal('email')), mb_strtolower($data['email']))) {
            $user->email_verified_at = null;
        }

        foreach ($data['notifications'] ?? [] as $key => $value) {
            $user->{'notify_'.$key} = (bool) $value;
        }

        $user->save();

        return response()->json([
            'user' => new UserResource($user->fresh()),
            'message' => 'Your preferences are saved.',
        ]);
    }

    /** PUT /api/settings/password */
    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['That is not your current password.'],
            ]);
        }

        $user->forceFill(['password' => $data['password']])->save();

        // Keep this device signed in, drop the others.
        DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $request->session()->getId())
            ->delete();

        return response()->json(['message' => 'Password updated. Other devices were signed out.']);
    }

    /** POST /api/settings/avatar */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate(['avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048']]);

        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->avatar_path = $request->file('avatar')->store('avatars', 'public');
        $user->save();

        return response()->json([
            'user' => new UserResource($user),
            'message' => 'Photo updated.',
        ]);
    }

    /** DELETE /api/settings/avatar */
    public function removeAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
            $user->update(['avatar_path' => null]);
        }

        return response()->json(['user' => new UserResource($user), 'message' => 'Photo removed.']);
    }

    /** DELETE /api/settings/sessions/{sessionId} */
    public function destroySession(Request $request, string $sessionId): JsonResponse
    {
        if ($sessionId === $request->session()->getId()) {
            return response()->json(['message' => "You can't sign out of the device you're using."], 422);
        }

        $deleted = DB::table('sessions')
            ->where('id', $sessionId)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json([
            'message' => $deleted ? 'That device was signed out.' : 'That session is already gone.',
        ]);
    }

    /** Every live database session for this user, newest first. */
    private function devices(Request $request): array
    {
        $currentId = $request->session()->getId();

        return DB::table('sessions')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('last_activity')
            ->limit(6)
            ->get()
            ->map(function ($session) use ($currentId) {
                $agent = (string) $session->user_agent;

                return [
                    'id' => $session->id,
                    'browser' => $this->browserName($agent),
                    'platform' => $this->platformName($agent),
                    'is_current' => $session->id === $currentId,
                    'last_active_at' => date('c', $session->last_activity),
                    'ip_address' => $session->ip_address,
                ];
            })
            ->all();
    }

    private function browserName(string $agent): string
    {
        foreach (['Edge' => 'Edge', 'OPR' => 'Opera', 'Chrome' => 'Chrome', 'Firefox' => 'Firefox', 'Safari' => 'Safari'] as $token => $label) {
            if (str_contains($agent, $token)) {
                return $label;
            }
        }

        return 'Unknown browser';
    }

    private function platformName(string $agent): string
    {
        foreach (['Windows NT' => 'Windows', 'Mac OS X' => 'macOS', 'Android' => 'Android', 'iPhone' => 'iOS', 'Linux' => 'Linux'] as $token => $label) {
            if (str_contains($agent, $token)) {
                return $label;
            }
        }

        return 'Unknown device';
    }
}
