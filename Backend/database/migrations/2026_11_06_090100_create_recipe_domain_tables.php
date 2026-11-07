<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('category', 64)->nullable();
            $table->string('default_unit', 32)->nullable();
            $table->timestamps();
        });

        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->unsignedSmallInteger('prep_minutes')->nullable();
            $table->unsignedSmallInteger('cook_minutes')->nullable();
            $table->string('difficulty', 16)->default('easy');
            $table->string('meal_category', 32)->nullable();
            $table->string('cuisine', 64)->nullable();
            $table->unsignedTinyInteger('servings')->default(2);
            $table->unsignedSmallInteger('calories')->nullable();
            $table->json('steps')->nullable();
            $table->json('dietary_tags')->nullable();
            $table->string('source', 16)->default('own');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index('difficulty');
            $table->index('meal_category');
        });

        Schema::create('recipe_ingredient', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 8, 2)->nullable();
            $table->string('unit', 32)->nullable();
            $table->string('note', 191)->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['recipe_id', 'ingredient_id']);
            $table->index('ingredient_id');
        });

        Schema::create('meal_plan_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('meal_slot', 16)->default('dinner');
            $table->string('status', 16)->default('planned');
            $table->timestamp('cooked_at')->nullable();
            $table->unsignedTinyInteger('servings')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'date']);
        });

        Schema::create('kitchen_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'ingredient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kitchen_items');
        Schema::dropIfExists('meal_plan_entries');
        Schema::dropIfExists('recipe_ingredient');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('ingredients');
    }
};
