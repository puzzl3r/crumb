import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import FoodImage from '../components/FoodImage'
import Modal from '../components/Modal'
import PlanPicker from '../components/PlanPicker'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api, errorMessage } from '../lib/api'
import { useResource } from '../lib/hooks'
import { difficultyLabel } from '../components/RecipeCard'
import { CATEGORIES, formatQuantity, labelFor } from '../lib/options'
import {
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconLeaf,
  IconPencil,
  IconPlus,
  IconTrash,
  IconUser,
} from '../lib/icons'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { data, loading, error, reload } = useResource(`/recipes/${id}`, [id])
  const [planning, setPlanning] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (loading) return <DetailSkeleton />
  if (error) return <div className="alert alert--error">{error}</div>

  const recipe = data.recipe
  const match = recipe.kitchen_match || { matched: 0, total: 0, percent: 0, missing: [] }
  const total = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0)

  async function stockUp(name) {
    try {
      const res = await api.post('/kitchen', { name })
      toast.success(res.data.message)
      reload(true)
    } catch (err) {
      toast.error(errorMessage(err, 'Could not add that to your kitchen.'))
    }
  }

  async function destroy() {
    try {
      await api.delete(`/recipes/${recipe.id}`)
      toast.success('Recipe deleted.')
      navigate(recipe.is_mine ? '/app/my-recipes' : '/app/recipes', { replace: true })
    } catch (err) {
      toast.error(errorMessage(err, 'That recipe is still here.'))
      setConfirming(false)
    }
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link className="link link--muted" to="/app/recipes">
          <IconArrowLeft size={14} /> Back to recipes
        </Link>
      </div>

      <div className="detail">
        <div>
          <div className="detail__hero">
            <FoodImage src={recipe.image_url} alt={recipe.name} />
          </div>

          <h1 style={{ marginTop: 20 }}>{recipe.name}</h1>
          {recipe.description && <p className="muted" style={{ marginTop: 8 }}>{recipe.description}</p>}

          <div className="detail__meta">
            <span className="pill-meta">
              <IconClock size={14} /> {total > 0 ? `${total} min` : 'No time logged'}
            </span>
            <span className="pill-meta">{difficultyLabel(recipe.difficulty)}</span>
            {recipe.meal_category && <span className="pill-meta">{labelFor(CATEGORIES, recipe.meal_category)}</span>}
            <span className="pill-meta">{recipe.servings ?? 2} serving{(recipe.servings ?? 2) === 1 ? '' : 's'}</span>
            {recipe.calories ? <span className="pill-meta">{recipe.calories} kcal</span> : null}
            {recipe.cuisine && <span className="pill-meta">{recipe.cuisine}</span>}
          </div>

          <div className="toolbar" style={{ gap: 10 }}>
            <button className="btn btn--accent" onClick={() => setPlanning(true)}>
              <IconPlus size={15} /> Add to plan
            </button>
            {recipe.can_edit && (
              <Link className="btn btn--outline" to={`/app/recipes/${recipe.id}/edit`}>
                <IconPencil size={15} /> Edit
              </Link>
            )}
            {recipe.can_delete && (
              <button className="btn btn--danger" onClick={() => setConfirming(true)}>
                <IconTrash size={15} /> Delete
              </button>
            )}
          </div>

          <section className="section">
            <div className="section__head">
              <h2>Ingredients</h2>
              <span className="meta">
                {match.matched} of {match.total} in your kitchen
              </span>
            </div>
            <div className="card ing-list">
              {(recipe.ingredients || []).map((ing) => {
                const missing = (match.missing || []).includes(ing.name)
                return (
                  <div className="ing-line" key={ing.id}>
                    <span className="ing-line__name">{ing.name}</span>
                    <span className="ing-line__qty">
                      {formatQuantity(ing)}
                      {ing.note ? ` · ${ing.note}` : ''}
                    </span>
                    <span className="ing-line__act">
                      {missing ? (
                        <button className="btn btn--xs btn--ghost" onClick={() => stockUp(ing.name)}>
                          <IconLeaf size={13} /> I have this now
                        </button>
                      ) : (
                        <span className="badge badge--cooked">
                          <IconCheck size={12} /> in stock
                        </span>
                      )}
                    </span>
                  </div>
                )
              })}
              {(recipe.ingredients || []).length === 0 && (
                <p className="muted" style={{ padding: '14px 18px' }}>
                  No ingredients were logged for this recipe.
                </p>
              )}
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2>Method</h2>
              <span className="meta">{(recipe.steps || []).length} steps</span>
            </div>
            <div className="card" style={{ padding: 20 }}>
              {(recipe.steps || []).length === 0 ? (
                <p className="muted">This recipe has no steps written up yet.</p>
              ) : (
                <ol className="step-list">
                  {recipe.steps.map((step, i) => (
                    <li key={i}>
                      <span className="step-list__n">{i + 1}</span>
                      <p style={{ lineHeight: 1.6 }}>{step}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>

        <aside className="editor__stack">
          <div className="card settings-card">
            <div className="settings-card__head">
              <div className="settings-card__icon">
                <IconLeaf size={17} />
              </div>
              <div>
                <h3>Against your kitchen</h3>
                <p>{user?.name?.split(' ')[0] || 'You'} have {match.matched} of {match.total}.</p>
              </div>
            </div>

            <div className="meter" style={{ maxWidth: 'none' }}>
              <div
                className={`meter__fill${match.percent === 100 ? '' : ' meter__fill--partial'}`}
                style={{ width: `${match.percent}%` }}
              />
            </div>

            {match.missing?.length > 0 ? (
              <div className="kitchen__chips" style={{ marginTop: 14 }}>
                {match.missing.map((name) => (
                  <button className="chip chip--missing" key={name} onClick={() => stockUp(name)} style={{ cursor: 'pointer' }}>
                    + {name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="alert alert--success" style={{ marginTop: 14 }}>
                Everything is in the kitchen. Cook away.
              </div>
            )}
          </div>

          <div className="card settings-card">
            <div className="settings-card__head">
              <div className="settings-card__icon">
                <IconClock size={17} />
              </div>
              <div>
                <h3>The details</h3>
                <p>Prep, cook and portion.</p>
              </div>
            </div>
            <div className="setting-row">
              <div className="setting-row__text">
                <strong>Prep</strong>
                <p>Before the heat goes on</p>
              </div>
              <span className="meta">{recipe.prep_minutes ?? 0} min</span>
            </div>
            <div className="setting-row">
              <div className="setting-row__text">
                <strong>Cook</strong>
                <p>Hands-on and waiting</p>
              </div>
              <span className="meta">{recipe.cook_minutes ?? 0} min</span>
            </div>
            <div className="setting-row">
              <div className="setting-row__text">
                <strong>Serves</strong>
                <p>Scale it in the planner</p>
              </div>
              <span className="meta">{recipe.servings ?? 2}</span>
            </div>
            {recipe.dietary_tags?.length > 0 && (
              <div className="kitchen__chips" style={{ marginTop: 12 }}>
                {recipe.dietary_tags.map((tag) => (
                  <span className="chip" key={tag}>
                    {tag.replace('_', '-')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {recipe.owner?.name && (
            <div className="card settings-card">
              <div className="settings-card__head">
                <div className="settings-card__icon">
                  <IconUser size={17} />
                </div>
                <div>
                  <h3>{recipe.owner.name}</h3>
                  <p>{recipe.source === 'own' ? 'Added by you' : 'From the community library'}</p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {planning && <PlanPicker recipe={recipe} onClose={() => setPlanning(false)} />}

      {confirming && (
        <Modal
          title="Delete this recipe?"
          onClose={() => setConfirming(false)}
          footer={
            <>
              <button className="btn btn--outline" onClick={() => setConfirming(false)}>
                Keep it
              </button>
              <button className="btn btn--primary" onClick={destroy}>
                Delete recipe
              </button>
            </>
          }
        >
          <p className="muted">
            {recipe.is_mine
              ? `"${recipe.name}" and any meals using it in your planner will be removed.`
              : `"${recipe.name}" is a Crumb library recipe, so deleting it removes it for every cook and clears it from any planner that uses it.`}
          </p>
        </Modal>
      )}
    </>
  )
}

function DetailSkeleton() {
  return (
    <div className="detail">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="skeleton" style={{ height: 300, borderRadius: 22 }} />
        <div className="skeleton" style={{ height: 34, width: '55%' }} />
        <div className="skeleton" style={{ height: 120 }} />
      </div>
      <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />
    </div>
  )
}
