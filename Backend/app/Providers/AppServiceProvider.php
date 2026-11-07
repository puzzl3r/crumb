<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\ValidationException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Responses already describe their own shape ("recipes", "user"), so the
        // extra {"data": …} envelope would just be noise the SPA has to unwrap.
        JsonResource::withoutWrapping();

        $this->configureRateLimiting();
    }

    /**
     * Auth endpoints are the ones an attacker can reach without credentials,
     * so they get their own tighter buckets.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(240)->by($request->user()?->id ?: $request->ip()));

        RateLimiter::for('login', function (Request $request) {
            $key = mb_strtolower((string) $request->input('email')).'|'.$request->ip();

            return Limit::perMinute(6)->by($key)->response(
                fn () => throw ValidationException::withMessages([
                    'email' => ['Too many sign-in attempts. Wait a minute and try again.'],
                ])
            );
        });

        RateLimiter::for('register', fn (Request $request) => Limit::perHour(8)->by($request->ip()));

        RateLimiter::for('forgot-password', function (Request $request) {
            return [
                Limit::perMinute(5)->by(mb_strtolower((string) $request->input('email')).'|'.$request->ip()),
                Limit::perHour(20)->by($request->ip()),
            ];
        });

        RateLimiter::for('reset-password', fn (Request $request) => Limit::perMinute(6)->by($request->ip()));

        RateLimiter::for('verification-link', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));

        RateLimiter::for('resend-verification', fn (Request $request) => Limit::perMinute(3)->by($request->user()?->id ?: $request->ip()));
    }
}
