<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_path')->nullable()->after('password');
            $table->string('dietary_preference', 32)->default('none')->after('avatar_path');
            $table->json('allergies')->nullable()->after('dietary_preference');
            $table->unsignedTinyInteger('household_size')->default(2)->after('allergies');
            $table->unsignedTinyInteger('default_servings')->default(2)->after('household_size');
            $table->string('cooking_time_preference', 32)->default('any')->after('default_servings');
            $table->string('measurement_unit', 16)->default('metric')->after('cooking_time_preference');
            $table->boolean('notify_meal_reminders')->default(true)->after('measurement_unit');
            $table->boolean('notify_weekly_inspiration')->default(true)->after('notify_meal_reminders');
            $table->boolean('notify_product_news')->default(false)->after('notify_weekly_inspiration');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
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
            ]);
        });
    }
};
