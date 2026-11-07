<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\KitchenController;
use App\Http\Controllers\Api\MealPlanController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:register');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:forgot-password');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:reset-password');

    // Opened straight from the email, so it is signed rather than session-backed.
    Route::get('email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware(['signed', 'throttle:verification-link'])
        ->name('api.verification.verify');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('email/verification-notification', [AuthController::class, 'resendVerification'])
            ->middleware('throttle:resend-verification');
    });
});

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index']);

    // Declared before the resource so "mine" is never swallowed by {recipe}.
    Route::get('recipes/mine', [RecipeController::class, 'mine']);
    Route::apiResource('recipes', RecipeController::class)->whereNumber('recipe');

    // Named {entry} so the controller's MealPlanEntry $entry binds by name.
    Route::get('meal-plan', [MealPlanController::class, 'index']);
    Route::post('meal-plan', [MealPlanController::class, 'store']);
    Route::put('meal-plan/{entry}', [MealPlanController::class, 'update'])->whereNumber('entry');
    Route::delete('meal-plan/{entry}', [MealPlanController::class, 'destroy'])->whereNumber('entry');

    Route::get('kitchen/recipes', [KitchenController::class, 'recipes']);
    Route::get('kitchen', [KitchenController::class, 'index']);
    Route::post('kitchen', [KitchenController::class, 'store']);
    Route::delete('kitchen/{ingredient}', [KitchenController::class, 'destroy'])->whereNumber('ingredient');

    Route::put('settings/password', [SettingsController::class, 'updatePassword']);
    Route::post('settings/avatar', [SettingsController::class, 'uploadAvatar']);
    Route::delete('settings/avatar', [SettingsController::class, 'removeAvatar']);
    Route::delete('settings/sessions/{sessionId}', [SettingsController::class, 'destroySession']);
    Route::get('settings', [SettingsController::class, 'show']);
    Route::put('settings', [SettingsController::class, 'update']);
});
