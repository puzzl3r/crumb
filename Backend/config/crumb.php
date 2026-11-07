<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Frontend URL
    |--------------------------------------------------------------------------
    |
    | Links inside password-reset and email-verification notifications point
    | here, because the SPA owns those screens.
    |
    */

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

    /*
    |--------------------------------------------------------------------------
    | Debug Reset Link
    |--------------------------------------------------------------------------
    |
    | When true (and the app is in the "local" environment) the password-reset
    | endpoint also returns the signed reset link in its JSON response, so the
    | flow can be exercised without a working mail server. This leaks a usable
    | token to any caller that knows an account's email address, so it must
    | never be enabled anywhere real users live.
    |
    */

    'debug_reset_link' => filter_var(env('CRUMB_DEBUG_RESET_LINK', false), FILTER_VALIDATE_BOOLEAN),

    /*
    |--------------------------------------------------------------------------
    | Meal Slots
    |--------------------------------------------------------------------------
    */

    'meal_slots' => ['breakfast', 'lunch', 'dinner', 'snack'],

    'difficulties' => ['easy', 'medium', 'hard'],

    'categories' => ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'],

    'dietary_preferences' => ['none', 'vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'pescatarian'],

    'time_preferences' => ['any', 'under_15', 'under_30', 'under_45', 'under_60'],

    'measurement_units' => ['metric', 'imperial'],

];
