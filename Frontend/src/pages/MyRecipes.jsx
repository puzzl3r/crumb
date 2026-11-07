import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../components/AppShell'
import Modal from '../components/Modal'
import RecipeCard from '../components/RecipeCard'
import { api, errorMessage } from '../lib/api'
import { useDebounced, useResource } from '../lib/hooks'
import { IconPlus, IconSearch } from '../lib/icons'

export default function MyRecipes() {
  const [term, setTerm] = useState('')
  const [confirming, setConfirming] = useState(null)
  const [notice, setNotice] = useState(null)

  const q = useDebounced(term)
  const url = useMemo(() => `/recipes/mine?q=${encodeURIComponent(q.trim())}`, [q])
  const { data, loading, error, reload } = useResource(url)
  const recipes = data?.recipes ?? []

  async function remove(recipe) {
    try {
      const { data: res } = await api.delete(`/recipes/${recipe.id}`)
      setNotice(res.message)
      setConfirming(null)
      reload(true)
    } catch (err) {
      setNotice(errorMessage(err, 'That recipe is still here.'))
      setConfirming(null)
    }
  }

  return (
    <>
      <PageHead
        title="My recipes"
        subtitle={
          data
            ? `${data.meta.total} recipe${data.meta.total === 1 ? '' : 's'} you added yourself`
            : 'Everything you have saved lives here, kitchen matches included.'
        }
        action={
          <Link className="btn btn--accent" to="/app/recipes/new">
            <IconPlus size={15} /> Add your recipe
          </Link>
        }
      />

      {notice && <div className="alert alert--success" style={{ marginBottom: 16 }}>{notice}</div>}
      {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="toolbar">
        <div className="search-bar">
          <span className="search-bar__glyph">
            <IconSearch size={17} />
          </span>
          <input
            className="input"
            placeholder="Search your recipes…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
      </div>

      {!loading && recipes.length === 0 && !error && (
        <div className="empty section">
          <strong>{term ? `Nothing of yours matches "${term}".` : 'You have not added a recipe yet'}</strong>
          {term
            ? 'Try a shorter word — family names, nicknames and typos all count.'
            : 'Start with the dish you make most often. It only takes a minute.'}
          <div style={{ marginTop: 16 }}>
            <Link className="btn btn--accent btn--sm" to="/app/recipes/new">
              <IconPlus size={15} /> Add your recipe
            </Link>
          </div>
        </div>
      )}

      <div className="grid-3 section">
        {loading
          ? [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 230 }} />)
          : recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                match={recipe.kitchen_match?.matched || null}
                actions={
                  <>
                    <Link className="btn btn--sm btn--soft" to={`/app/recipes/${recipe.id}/edit`}>
                      Edit
                    </Link>
                    <button className="btn btn--sm btn--danger" onClick={() => setConfirming(recipe)}>
                      Delete
                    </button>
                  </>
                }
              />
            ))}
      </div>

      {confirming && (
        <Modal
          title="Delete this recipe?"
          subtitle="Your own recipes cannot be recovered once removed."
          onClose={() => setConfirming(null)}
          footer={
            <>
              <button className="btn btn--outline" onClick={() => setConfirming(null)}>
                Keep it
              </button>
              <button className="btn btn--primary" onClick={() => remove(confirming)}>
                Delete recipe
              </button>
            </>
          }
        >
          <h3>{confirming.name}</h3>
          <p className="muted" style={{ marginTop: 8 }}>
            {(confirming.ingredients?.length ?? 0) > 0
              ? `Built from ${confirming.ingredients.length} ingredients.`
              : 'This one has no ingredients logged.'}{' '}
            Any meals using it are cleared from your planner too.
          </p>
        </Modal>
      )}
    </>
  )
}
