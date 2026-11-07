import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../components/AppShell'
import PlanPicker from '../components/PlanPicker'
import RecipeCard from '../components/RecipeCard'
import { useDebounced, useResource } from '../lib/hooks'
import { CATEGORIES, DIFFICULTIES, SORTS, TIME_FILTERS } from '../lib/options'
import { IconPlus, IconSearch } from '../lib/icons'

export default function Recipes() {
  const [term, setTerm] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [category, setCategory] = useState('')
  const [time, setTime] = useState('')
  const [sort, setSort] = useState('')
  const [page, setPage] = useState(1)
  const [planning, setPlanning] = useState(null)

  const q = useDebounced(term)

  const url = useMemo(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (difficulty) params.set('difficulty', difficulty)
    if (category) params.set('category', category)
    if (time) params.set('time', time)
    if (sort) params.set('sort', sort)
    params.set('limit', 12)
    params.set('page', page)
    return `/recipes?${params}`
  }, [q, difficulty, category, time, sort, page])

  const { data, loading, error } = useResource(url)
  const recipes = data?.recipes ?? []
  const meta = data?.meta

  const activeFilters = [difficulty, category, time].filter(Boolean).length

  function resetPage() {
    setPage(1)
  }

  return (
    <>
      <PageHead
        title="Discover recipes"
        subtitle={
          meta
            ? `${meta.total} recipe${meta.total === 1 ? '' : 's'} · ${meta.kitchen_size} ingredient${meta.kitchen_size === 1 ? '' : 's'} in your kitchen`
            : 'Search the library or your own recipes.'
        }
        action={
          <Link className="btn btn--accent" to="/app/recipes/new">
            <IconPlus size={15} /> Add your recipe
          </Link>
        }
      />

      <div className="toolbar">
        <div className="search-bar">
          <span className="search-bar__glyph">
            <IconSearch size={17} />
          </span>
          <input
            className="input"
            placeholder="Search by name, cuisine or ingredient…"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value)
              resetPage()
            }}
          />
        </div>
        <FilterSelect value={sort} onChange={(v) => { setSort(v); resetPage() }} options={SORTS} />
      </div>

      <div className="toolbar" style={{ marginTop: 14, alignItems: 'flex-start' }}>
        <Chips
          options={DIFFICULTIES}
          value={difficulty}
          onChange={(v) => { setDifficulty(v); resetPage() }}
          allLabel="Any difficulty"
        />
        <Chips
          options={CATEGORIES}
          value={category}
          onChange={(v) => { setCategory(v); resetPage() }}
          allLabel="All meals"
        />
        <Chips
          options={TIME_FILTERS.filter((t) => t.value)}
          value={time}
          onChange={(v) => { setTime(v); resetPage() }}
          allLabel="Any length"
        />
        {activeFilters > 0 && (
          <button
            className="link link--muted"
            onClick={() => {
              setDifficulty('')
              setCategory('')
              setTime('')
              resetPage()
            }}
          >
            Clear {activeFilters} filter{activeFilters === 1 ? '' : 's'}
          </button>
        )}
      </div>

      {error && <div className="alert alert--error" style={{ marginTop: 18 }}>{error}</div>}

      {!loading && recipes.length === 0 && !error && (
        <div className="empty section">
          <strong>Nothing matches that yet</strong>
          Try a shorter search, or clear the filters and browse everything.
        </div>
      )}

      <div className="grid-3 section">
        {loading
          ? [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" style={{ height: 230 }} />)
          : recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                match={recipe.kitchen_match?.matched || null}
                actions={
                  <button className="btn btn--sm btn--soft" onClick={() => setPlanning(recipe)}>
                    + Add to plan
                  </button>
                }
              />
            ))}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="toolbar" style={{ justifyContent: 'center', marginTop: 26 }}>
          <button className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="meta">
            Page {meta.page} of {meta.last_page}
          </span>
          <button className="btn btn--outline btn--sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}

      {planning && (
        <PlanPicker recipe={planning} onClose={() => setPlanning(null)} />
      )}
    </>
  )
}

function Chips({ options, value, onChange, allLabel }) {
  return (
    <div className="toolbar" style={{ gap: 8 }}>
      <button
        className={`chip${value === '' ? ' chip--active' : ''}`}
        onClick={() => onChange('')}
        style={{ cursor: 'pointer' }}
      >
        {allLabel}
      </button>
      {options.map((o) => (
        <button
          key={o.value}
          className={`chip${value === o.value ? ' chip--active' : ''}`}
          onClick={() => onChange(o.value)}
          style={{ cursor: 'pointer' }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="select-wrap" style={{ minWidth: 180 }}>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Sort recipes">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
