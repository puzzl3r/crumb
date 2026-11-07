<?php

// One-off: copy every Crumb table from the SQLite file into the MySQL `crumb` database.
// Run from Backend/ with the MySQL connection as the default: php scripts/port-sqlite-to-mysql.php
// DESTRUCTIVE: it truncates the MySQL tables first, so only run it to move data one way.

require dirname(__DIR__).'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require dirname(__DIR__).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// FK order matters; sessions last so the browser keeps its login.
$tables = [
    'users',
    'password_reset_tokens',
    'ingredients',
    'recipes',
    'recipe_ingredient',
    'meal_plan_entries',
    'kitchen_items',
    'personal_access_tokens',
    'sessions',
];

// The built-in sqlite connection reads DB_DATABASE, which is now `crumb`, so point a
// private one straight at the file instead.
config(['database.connections.sqlite_source' => [
    'driver' => 'sqlite',
    'url' => null,
    'database' => dirname(__DIR__).'/database/database.sqlite',
    'prefix' => '',
    'foreign_key_constraints' => false,
]]);

$src = DB::connection('sqlite_source');
$dst = DB::connection('mysql');

foreach ($tables as $table) {
    if ($dst->getSchemaBuilder()->hasTable($table) === false) {
        echo str_pad($table, 26)."SKIP (no target table)\n";

        continue;
    }

    $dst->statement("SET FOREIGN_KEY_CHECKS=0");
    $dst->table($table)->truncate();

    $rows = $src->table($table)->get();
    $count = 0;

    foreach ($rows->chunk(200) as $chunk) {
        $payload = [];

        foreach ($chunk as $row) {
            $payload[] = (array) $row;
        }

        if ($payload !== []) {
            $dst->table($table)->insert($payload);
            $count += count($payload);
        }
    }

    // Keep the next auto-increment clear of the ids we just carried over.
    // Keyed tables such as password_reset_tokens have no id column at all.
    if (in_array('id', $dst->getSchemaBuilder()->getColumnListing($table), true)) {
        $max = $dst->table($table)->max('id');
        $next = is_int($max) ? $max + 1 : null;
        if ($next !== null) {
            $dst->statement("ALTER TABLE {$table} AUTO_INCREMENT = {$next}");
        }
    } else {
        $next = '-';
    }

    printf("%-26s %4d rows  auto_increment=%s\n", $table, $count, $next);
}

$dst->statement('SET FOREIGN_KEY_CHECKS=1');

echo "\nverify:\n";
foreach ($tables as $table) {
    printf("%-26s sqlite=%-5d mysql=%-5d\n", $table, $src->table($table)->count(), $dst->table($table)->count());
}

echo "\nusers: ";
foreach ($dst->table('users')->get() as $u) {
    echo $u->id.':'.$u->email.'  ';
}
echo "\nrecipes: ";
foreach ($dst->table('recipes')->orderBy('id')->get() as $r) {
    echo $r->id.':'.$r->name.'(owner='.($r->user_id ?? 'library').')  ';
}
echo "\n";
