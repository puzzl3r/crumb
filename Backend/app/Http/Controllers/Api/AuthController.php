<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** POST /api/auth/register */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email:rfc', 'max:191', 'unique:users,email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
            'dietary_preference' => ['nullable', 'string', 'in:'.implode(',', config('crumb.dietary_preferences'))],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => Str::lower($data['email']),
            'password' => $data['password'],
            'dietary_preference' => $data['dietary_preference'] ?? 'none',
        ]);

        event(new Registered($user));

        $this->startSession($user, true);

        return response()->json([
            'message' => 'Welcome to Crumb.',
            'user' => new UserResource($user->fresh()),
        ], 201);
    }

    /** POST /api/auth/login */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email', 'max:191'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $remember = (bool) ($credentials['remember'] ?? true);

        if (! Auth::attempt(['email' => Str::lower($credentials['email']), 'password' => $credentials['password']], $remember)) {
            throw ValidationException::withMessages([
                'email' => ["We couldn't find an account with those details."],
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Signed in.',
            'user' => new UserResource(Auth::user()),
        ]);
    }

    /** POST /api/auth/logout */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out. Cook something lovely soon.']);
    }

    /** GET /api/auth/me */
    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => new UserResource($request->user())]);
    }

    /** POST /api/auth/forgot-password */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $token = null;

        $status = Password::sendResetLink(
            ['email' => Str::lower($request->email)],
            function (User $user, string $plainToken) use (&$token) {
                $token = $plainToken;
                $user->sendPasswordResetNotification($plainToken);

                return null;
            }
        );

        $payload = [
            // Same wording whether or not the address exists: never confirm
            // which emails have accounts.
            'message' => 'If that address has an account, a reset link is on its way.',
            'sent' => $status === Password::RESET_LINK_SENT,
        ];

        if ($token && config('crumb.debug_reset_link') && app()->environment('local')) {
            $payload['debug_reset_link'] = $this->frontendUrl('/reset-password')
                .'?token='.$token.'&email='.urlencode($request->email);
        }

        return response()->json($payload);
    }

    /** POST /api/auth/reset-password */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                // A reset should invalidate every other live session.
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return response()->json(['message' => 'Your password has been reset. Sign in to continue.']);
    }

    /** POST /api/auth/email/verification-notification */
    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'That address is already verified.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'We sent another verification link.'], 202);
    }

    /** GET /api/auth/email/verify/{id}/{hash} — hit from the email, not the SPA. */
    public function verifyEmail(Request $request, User $user, string $hash)
    {
        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return redirect($this->frontendUrl('/app?email=invalid'));
        }

        $user->markEmailAsVerified();

        return redirect($this->frontendUrl('/app?email=verified'));
    }

    private function startSession(User $user, bool $remember): void
    {
        Auth::guard('web')->login($user, $remember);
        request()->session()->regenerate();
    }

    private function frontendUrl(string $path): string
    {
        return rtrim(config('crumb.frontend_url'), '/').$path;
    }
}
