/**
 * Smoke test for the Crumb API using the Sanctum SPA cookie flow.
 * Usage: node scripts/api-smoke.mjs [base]
 */
const BASE = process.argv[2] || 'http://127.0.0.1:8000'

let cookies = ''

function capture(res) {
  const set = res.headers.getSetCookie?.() || []
  for (const c of set) {
    const pair = c.split(';')[0]
    const name = pair.split('=')[0]
    cookies = cookies
      .split('; ')
      .filter((p) => p && !p.startsWith(name + '='))
      .concat([pair])
      .join('; ')
  }
}

function xsrf() {
  const m = cookies.match(/XSRF-TOKEN=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : undefined
}

async function call(method, path, body, opts = {}) {
  const res = await send(method, path, body, opts)

  // Mirrors what the SPA does: a rotated session leaves a stale token behind.
  if (method !== 'GET' && res.status === 419 && !opts.noRetry) {
    await call('GET', '/sanctum/csrf-cookie')
    return send(method, path, body, opts)
  }

  return res
}

async function send(method, path, body, opts = {}) {
  const headers = {
    Accept: 'application/json',
    Referer: 'http://localhost:5173/',
    Origin: 'http://localhost:5173',
    Cookie: cookies,
    ...opts.headers,
  }

  if (method !== 'GET') {
    headers['X-XSRF-TOKEN'] = xsrf()
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })

  capture(res)

  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text.slice(0, 200)
  }

  return { status: res.status, json }
}

const results = []
function check(label, ok, detail) {
  results.push({ label, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
}

await call('GET', '/sanctum/csrf-cookie')
check('csrf cookie issued', /XSRF-TOKEN=/.test(cookies))

let r = await call('GET', '/api/auth/me')
check('guest me -> 401', r.status === 401, JSON.stringify(r.json)?.slice(0, 90))

r = await call('POST', '/api/auth/login', { email: 'archer.bennett@gmail.com', password: 'wrong' })
check('bad password rejected', r.status === 422)

r = await call('POST', '/api/auth/login', {
  email: 'archer.bennett@gmail.com',
  password: 'password123',
  remember: true,
})
check('login succeeds', r.status === 200 && r.json?.user?.email === 'archer.bennett@gmail.com', r.json?.message)

r = await call('GET', '/api/auth/me')
check('me returns profile', r.status === 200 && r.json?.user?.name === 'Archer Bennett')

r = await call('GET', '/api/dashboard')
const d = r.json
check(
  'dashboard payload',
  r.status === 200 && d?.greeting && Array.isArray(d?.suggestions) && Array.isArray(d?.coming_up),
  `suggestions=${d?.suggestions?.length} comingUp=${d?.coming_up?.length} cooked=${d?.stats?.cooked_this_week}`,
)

r = await call('GET', '/api/recipes?limit=12')
check('recipe list', r.status === 200 && r.json?.recipes?.length === 12, `total=${r.json?.meta?.total}`)

r = await call('GET', '/api/recipes?q=chicken')
check('search chicken', r.status === 200 && r.json?.recipes?.length >= 2, `found=${r.json?.recipes?.length}`)

r = await call('GET', '/api/recipes?time=under_15&difficulty=easy')
check('filter quick+easy', r.status === 200, `found=${r.json?.recipes?.length}`)

r = await call('GET', '/api/recipes/mine')
check('my recipes', r.status === 200 && r.json?.recipes?.length === 2, `mine=${r.json?.recipes?.length}`)

r = await call('GET', '/api/kitchen')
check('kitchen items', r.status === 200 && r.json?.items?.length >= 7, `have=${r.json?.items?.length}`)

r = await call('GET', '/api/kitchen/recipes')
const kr = r.json
check(
  'kitchen ranking',
  r.status === 200 && kr?.recipes?.length > 0 && kr.recipes[0].matched >= kr.recipes.at(-1).matched,
  `candidates=${kr?.meta?.candidates} top=${kr?.recipes?.[0]?.recipe?.name} (${kr?.recipes?.[0]?.matched}/${kr?.recipes?.[0]?.total})`,
)

r = await call('POST', '/api/kitchen', { name: 'Rice' })
check('add kitchen item', r.status === 201 || r.status === 200, r.json?.message)

const kitchenId = (await call('GET', '/api/kitchen')).json.items.find((i) => i.name === 'Rice')?.id
r = await call('DELETE', `/api/kitchen/${kitchenId}`)
check('remove kitchen item', r.status === 200, r.json?.message)

r = await call('GET', '/api/meal-plan')
const mp = r.json
check(
  'meal plan week',
  r.status === 200 && mp?.days?.length === 7 && mp.days[0]?.slots?.lunch !== undefined,
  `planned=${mp?.summary?.planned} cooked=${mp?.summary?.cooked} week=${mp?.week?.label}`,
)

const targetDay = mp.days[2]
r = await call('POST', '/api/meal-plan', {
  recipe_id: kr.recipes[0].recipe.id,
  date: targetDay.date,
  meal_slot: 'dinner',
})
const newEntryId = r.json?.entry?.id
check('plan a meal', r.status === 201 && !!newEntryId, `entry=${newEntryId} on ${targetDay.date}`)

r = await call('POST', '/api/meal-plan', { recipe_id: kr.recipes[0].recipe.id, date: targetDay.date, meal_slot: 'dinner' })
check('duplicate slot blocked', r.status === 422, r.json?.message)

r = await call('PUT', `/api/meal-plan/${newEntryId}`, { status: 'cooked' })
check('mark cooked', r.status === 200 && r.json?.entry?.status === 'cooked')

r = await call('DELETE', `/api/meal-plan/${newEntryId}`)
check('unplan', r.status === 200, r.json?.message)

const created = await call('POST', '/api/recipes', {
  name: 'Smoke test noodles',
  description: 'Created by the api smoke script.',
  prep_minutes: 5,
  cook_minutes: 7,
  difficulty: 'easy',
  meal_category: 'dinner',
  servings: 1,
  steps: ['Boil water', 'Cook noodles', 'Drain and serve'],
  ingredients: [
    { name: 'Pasta', quantity: 100, unit: 'g' },
    { name: 'Eggs', quantity: 1, unit: 'pieces' },
  ],
})
const createdId = created.json?.recipe?.id
check('create recipe', created.status === 201 && !!createdId, `id=${createdId}`)

r = await call('PUT', `/api/recipes/${createdId}`, {
  name: 'Smoke test noodles (edited)',
  steps: ['Boil water', 'Cook noodles'],
  ingredients: [{ name: 'Pasta', quantity: 120, unit: 'g' }],
})
check('update recipe', r.status === 200 && r.json?.recipe?.name?.includes('edited'), r.json?.recipe?.name)

r = await call('GET', `/api/recipes/${createdId}`)
check('show recipe', r.status === 200 && r.json?.recipe?.ingredients?.length === 1)

r = await call('DELETE', `/api/recipes/${createdId}`)
check('delete recipe', r.status === 200, r.json?.message)

r = await call('PUT', '/api/settings', {
  name: 'Archer Bennett',
  household_size: 3,
  cooking_time_preference: 'under_45',
  notifications: { meal_reminders: false },
})
check(
  'save settings',
  r.status === 200 && (r.json?.user?.household_size === 3) && r.json?.user?.notifications?.meal_reminders === false,
)

r = await call('GET', '/api/settings')
check('settings devices', r.status === 200 && Array.isArray(r.json?.devices), `devices=${r.json?.devices?.length}`)

r = await call('POST', '/api/auth/forgot-password', { email: 'archer.bennett@gmail.com' })
check('forgot password sends', r.status === 200 && r.json?.sent === true, r.json?.message)
const resetLink = r.json?.debug_reset_link
check('debug reset link present (local only)', !!resetLink)

if (resetLink) {
  const params = new URL(resetLink).searchParams
  const reset = (token) =>
    call('POST', '/api/auth/reset-password', {
      token,
      email: params.get('email'),
      password: 'password123',
      password_confirmation: 'password123',
    })

  r = await reset(params.get('token'))
  check('reset password', r.status === 200, r.json?.message)

  r = await call('GET', '/api/auth/me')
  check('reset signs existing sessions out', r.status === 401, `me -> ${r.status}`)

  // A replayed token must fail even from a clean browser, so the session the
  // reset just invalidated can't mask the broker's own rejection.
  const jar = cookies
  cookies = ''
  r = await call('POST', '/api/auth/forgot-password', { email: 'archer.bennett@gmail.com' })
  const replay = new URL(r.json?.debug_reset_link).searchParams
  r = await reset(replay.get('token'))
  check('reset from a clean session', r.status === 200, r.json?.message)

  r = await reset(replay.get('token'))
  check('token single-use', r.status === 422, `${r.status} ${r.json?.errors?.email?.[0] ?? r.json?.message ?? ''}`)

  cookies = jar
  r = await call('POST', '/api/auth/login', { email: 'archer.bennett@gmail.com', password: 'password123' })
  check('login with reset password', r.status === 200, r.json?.message)
}

r = await call('POST', '/api/auth/register', {
  name: 'Smoke Tester',
  email: `smoke+${Date.now()}@crumb.test`,
  password: 'password123',
  password_confirmation: 'password123',
})
check('register', r.status === 201 && !!r.json?.user?.id, r.json?.message)

r = await call('POST', '/api/auth/logout')
check('logout', r.status === 200)

r = await call('GET', '/api/auth/me')
check('me after logout -> 401', r.status === 401)

const failed = results.filter((x) => !x.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
if (failed.length) {
  console.log('Failed:', failed.map((f) => f.label).join(', '))
  process.exitCode = 1
}
