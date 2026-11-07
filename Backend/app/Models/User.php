<?php

namespace App\Models;

use App\Notifications\PasswordResetLink;
use App\Notifications\VerifyEmailLink;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name',
    'email',
    'password',
    'avatar_path',
    'dietary_preference',
    'allergies',
    'household_size',
    'default_servings',
    'cooking_time_preference',
    'measurement_unit',
    'notify_meal_reminders',
    'notify_weekly_inspiration',
    'notify_product_news',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** The SPA owns the reset screen, so the broker's default link is wrong here. */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new PasswordResetLink($token, $this->email));
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailLink());
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'allergies' => 'array',
            'household_size' => 'integer',
            'default_servings' => 'integer',
            'notify_meal_reminders' => 'boolean',
            'notify_weekly_inspiration' => 'boolean',
            'notify_product_news' => 'boolean',
        ];
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }

    public function mealPlanEntries(): HasMany
    {
        return $this->hasMany(MealPlanEntry::class);
    }

    public function kitchenItems(): HasMany
    {
        return $this->hasMany(KitchenItem::class);
    }

    /** Catalogue slugs for everything this cook has on hand. */
    public function kitchenIngredientSlugs(): array
    {
        return $this->kitchenItems
            ->map(fn (KitchenItem $item) => $item->ingredient->slug)
            ->all();
    }

    public function avatarUrl(): ?string
    {
        return $this->avatar_path ? asset('storage/'.$this->avatar_path) : null;
    }
}
