import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../components/AppShell'
import FoodImage from '../components/FoodImage'
import PlanPicker from '../components/PlanPicker'
import { api, errorMessage } from '../lib/api'
import { useDebounced, useResource } from '../lib/hooks'
import { IconCheck, IconLeaf, IconPlus, IconSearch } from '../lib/icons'
import { CATEGORIES, labelFor } from '../lib/options'
import { difficultyLabel, minutesLabel } from '../components/RecipeCard'

export default function Ingredients() {
  const [typed, setTyped] = useState('')
  const [newItem, setNewItem] = useState('')
  const [planning, setPlanning] = useState(null)
  const [notice, setNotice] = useState(null)

  const kitchen = useResource('/kitchen')
  const q = useDebounced(typed)
  const url = useMemo(() => `/kitchen/recipes?q=${encodeURIComponent(q.trim())}`, [q])
  const ranked = useResource(url)

  const items = kitchen.data?.items ?? []
  const rows = ranked.data?.recipes ?? []

  async function add(name) {
    if (!name.trim()) return
    setNotice(null)
    try {
      const { data } = await api.post('/kitchen', { name: name.trim() })
      setNotice(data.message)
      setNewItem('')
      kitchen.reload(true)
      ranked.reload(true)
    } catch (err) {
      setNotice(errorMessage(err, 'Could not add that.'))
    }
  }

  async function remove(item) {
    setNotice(null)
    try {
      const { data } = await api.delete(`/kitchen/${item.id}`)
      setNotice(data.message)
      kitchen.reload(true)
      ranked.reload(true)
    } catch (err) {
      setNotice(errorMessage(err, 'Could not remove that.'))
    }
  }

  return (
    <>
      <PageHead
        title="Ingredient finder"
        subtitle={
          ranked.data
            ? `${items.length} logged · ${ranked.data.meta.candidates} recipes scored against your kitchen`
            : 'Log what you have; Crumb tells you what it becomes.'
        }
      />

      {notice && <div className="alert alert--info" style={{ marginBottom: 18 }}>{notice}</div>}

      <div className="kitchen">
        <aside className="card kitchen__panel">
          <div>
            <div className="eyebrow">Your kitchen</div>
            <h3 style={{ marginTop: 6 }}>
              {items.length === 0 ? 'Nothing logged yet' : `${items.length} ingredient${items.length === 1 ? '' : 's'} in`}
            </h3>
          </div>

          <div className="form-grid" style={{ gap: 10 }}>
            <div className="toolbar" style={{ gap: 8 }}>
              <input
                className="input"
                placeholder="Eggs, soy sauce, lemon…"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add(newItem)}
              />
              <button className="btn btn--primary" onClick={() => add(newItem)} disabled={!newItem.trim()}>
                <IconPlus size={15} /> Add
              </button>
            </div>
            <span className="field__hint">One at a time, or separate a few with commas.</span>
          </div>

          <div className="kitchen__chips">
            {kitchen.loading && items.length === 0
              ? [0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 28, width: 82, borderRadius: 999 }} />)
              : items.map((item) => (
                  <span className="chip chip--stocked" key={item.id}>
                    {item.name}
                    <button className="chip__x" onClick={() => remove(item)} aria-label={`Remove ${item.name}`}>
                      ×
                    </button>
                  </span>
                ))}
          </div>

          {items.length === 0 && kitchen.data && (
            <div className="empty" style={{ padding: 22 }}>
              <strong>Add your staples</strong>
              Ten seconds now means real suggestions on every page.
            </div>
          )}

          {kitchen.data?.suggestions?.length > 0 && (
            <div>
              <div className="field__label field__label--caps" style={{ marginBottom: 8 }}>
                Common next
              </div>
              <div className="kitchen__chips">
                {kitchen.data.suggestions.map((name) => (
                  <button className="chip" key={name} onClick={() => add(name)} style={{ cursor: 'pointer' }}>
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section>
          <div className="search-bar">
            <span className="search-bar__glyph">
              <IconSearch size={17} />
            </span>
            <input
              className="input"
              placeholder="Anything else in the fridge? Add names separated by commas…"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>

          {ranked.error && <div className="alert alert--error" style={{ marginTop: 16 }}>{ranked.error}</div>}

          <div className="card section" style={{ marginTop: 16, paddingTop: 4, paddingBottom: 4 }}>
            {ranked.loading && rows.length === 0
              ? [0, 1, 2].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 86, margin: 14, borderRadius: 12 }} />
                ))
              : rows.length === 0
                ? (
                    <div className="empty" style={{ border: 0, background: 'transparent' }}>
                      <strong>No recipes to score yet</strong>
                      The library grows with every recipe you add — and so does this list.
                    </div>
                  )
                : (
                  rows.map((row) => <MatchRow key={row.recipe.id} row={row} onPlan={setPlanning} />)
                )}
          </div>

          {ranked.data?.meta?.closest_missing?.length > 0 && (
            <div className="missing card" style={{ marginTop: 16 }}>
              <span className="meta" style={{ fontWeight: 700, color: 'var(--ink-700)' }}>
                <IconLeaf size={14} /> Buying these unlocks the most dinners:
              </span>
              {ranked.data.meta.closest_missing.map((miss) => (
                <button className="chip" key={miss.name} onClick={() => add(miss.name)} style={{ cursor: 'pointer' }}>
                  + {miss.name}
                  <span className="meta"> in {miss.count}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {planning && <PlanPicker recipe={planning} onClose={() => setPlanning(null)} />}
    </>
  )
}

function MatchRow({ row, onPlan }) {
  const { recipe, matched, total, percent, missing } = row
  const full = matched === total

  return (
    <div className="match-row">
      <Link to={`/app/recipes/${recipe.id}`} className="match-row__img" aria-label={recipe.name}>
        <FoodImage src={recipe.image_url} alt={recipe.name} />
      </Link>

      <div className="match-row__main">
        <div className="match-row__top">
          <div>
            <Link to={`/app/recipes/${recipe.id}`}>
              <h3>{recipe.name}</h3>
            </Link>
            <div className="meta">
              {minutesLabel(recipe)} · {difficultyLabel(recipe.difficulty)}
              {recipe.meal_category ? ` · ${labelFor(CATEGORIES, recipe.meal_category)}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={full ? 'meta--accent' : 'meta'} style={{ fontWeight: 700 }}>
              {full ? (
                <>
                  <IconCheck size={13} /> Ready to cook
                </>
              ) : (
                <>
                  {matched} of {total} in
                </>
              )}
            </div>
          </div>
        </div>

        <div className="meter">
          <div
            className={`meter__fill${full ? '' : ' meter__fill--partial'}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {!full && missing.length > 0 && (
          <div className="kitchen__chips">
            {missing.map((name) => (
              <span className="chip chip--missing" key={name}>
                {name}
              </span>
            ))}
          </div>
        )}

        <div className="toolbar" style={{ gap: 8 }}>
          <button className="btn btn--sm btn--soft" onClick={() => onPlan(recipe)}>
            + Add to plan
          </button>
          <Link className="link link--muted" to={`/app/recipes/${recipe.id}`}>
            See the steps
          </Link>
        </div>
      </div>
    </div>
  )
}
