# Crumb

A cooking companion that plans meals around what is already in your kitchen. Built from the
Crumb mockups: Laravel 13 + MySQL behind a JSON API, React 19 + Vite in front.

```
crumb/
├─ Backend/    Laravel API (Sanctum cookie sessions, MySQL)
└─ Frontend/   React SPA (react-router 7, axios, plain CSS design system)
```

## Prerequisites

- PHP 8.5 with `pdo_mysql` and `gd` enabled in `php.ini`
- A MySQL/MariaDB server answering on `127.0.0.1:3306` (see "Database" below)
- Composer, and Node 20+ (tested on 24)

## Run it

Two processes: the API on `127.0.0.1:8000`, the SPA on `localhost:5173`. Vite proxies `/api`,
`/sanctum`, `/storage` and `/build` to the API so the app stays same-origin and the session
cookie works without CORS.

```bash
# 1. API
cd Backend
composer install
copy .env.example .env        # then: php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link

# Windows: the built-in server needs no execution-time cap (see "Dev server timeout" below)
PHP_INI_SCAN_DIR="C:/full/path/to/crumb/Backend/.php-dev" \
  php artisan serve --host=127.0.0.1 --port=8000

# 2. SPA (new terminal)
cd Frontend
npm install
npm run dev                   # http://localhost:5173
```

Sign in with the seeded account — `archer.bennett@gmail.com` / `password123` — or create your
own at `/signup`.

Other scripts:

| Where | Command | What it does |
| --- | --- | --- |
| `Backend/` | `node scripts/api-smoke.mjs` | 35 checks over HTTP: auth lifecycle, recipe CRUD, planner ownership, kitchen matching, settings |
| `Backend/` | `php scripts/port-sqlite-to-mysql.php` | one-way copy of the old SQLite file into MySQL. **Truncates the MySQL tables first** — run it only to move data, not to refresh it |
| `Frontend/` | `npm run build` | Production bundle into `dist/` |
| `Frontend/` | `npm run lint` | oxlint |

## Database

Crumb uses the **XAMPP MariaDB 10.4** server (`C:\xampp\mysql`), database `crumb` on
`127.0.0.1:3306`, logging in as the limited `crumb@localhost` user whose password lives in
`Backend/.env`. That server holds `root` with a blank password, which is XAMPP's stock setup.

It is not installed as a Windows service, so it has to be started before the API will answer:

```bash
/c/xampp/mysql/bin/mysqld.exe --defaults-file="C:/xampp/mysql/bin/my.ini" --standalone
```

Two things to know:

- **Port 3306 is shared with the `MySQL80` service** (MySQL 8.0.46, `C:\Program Files\MySQL`),
  which was stopped to make room. Restart it with an elevated `net start MySQL80`, but then
  XAMPP's MySQL cannot start until it is stopped again.
- **The first request after the database server starts can take 20-50 s.** MariaDB does a reverse
  DNS lookup for every new client, and the very first one misses the Windows DNS cache. Later
  requests are sub-second, so don't read it as a hang — and `max_execution_time=0` (see the next
  section) keeps PHP from killing it.

`Backend/database/database.sqlite` is left in place as the pre-MySQL backup; nothing reads it
while `DB_CONNECTION=mysql`.

## Dev server timeout on Windows

`php -S` keeps one long-lived worker, and PHP's `max_execution_time` accumulates across requests
instead of resetting per request. After enough traffic the API dies with
"Maximum execution time of 30 seconds exceeded" — including on pages that take milliseconds.
`artisan serve` spawns the child without your `-d` flags, so the override has to reach the child
through the environment: `Backend/.php-dev/crumb-dev.ini` sets `max_execution_time = 0` and is
picked up via `PHP_INI_SCAN_DIR`.

## How the pieces fit

**Auth** — Sanctum SPA cookies (`/sanctum/csrf-cookie`, then a `web` session cookie). Password
reset uses Laravel's token broker; the reset link kills every other session, so
`Frontend/src/lib/api.js` re-bootstraps the CSRF token once on a 419 rather than surfacing
"CSRF token mismatch". `CRUMB_DEBUG_RESET_LINK=true` returns the reset URL in the API response
for local testing only — turn it off anywhere public.

**Kitchen matching** — the join key is a normalised ingredient slug (`Str::slug`), so "2 eggs" and
"eggs, free-range" land on the same row. `KitchenSnapshot` caches the user's slugs for the request
and every recipe list is ranked by match percentage against it.

**Planner** — `meal_plan_entries` holds `(user_id, date, meal_slot)` with a unique constraint; the
week grid queries one range and the dashboard reuses the same rows.

**Settings & devices** — sessions live in the database, so the device list is a `sessions` table
query and "sign out this device" deletes the row.

## Screens

Public: landing, log in, sign up, forgot password, reset password.
Signed in: dashboard, recipe discovery, recipe detail, add/edit recipe, meal planner, my recipes,
ingredient finder, settings.

## Not built yet

- No account deletion endpoint, so the settings page has no delete button.
- Seeded recipes have no photos; `Recipe::imageUrl()` checks the file and the UI falls back to a
  generated plate. Drop images at `Backend/storage/app/public/recipes/<slug>.jpg` to light them up.
- Recipe photos are stored but never resized; there is no queue, so anything heavy runs inline.
