import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHead } from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { api, errorMessage } from '../lib/api'
import { useResource } from '../lib/hooks'
import { CATEGORIES, DIFFICULTIES, UNITS } from '../lib/options'
import { IconCamera, IconPlus, IconX } from '../lib/icons'

const blankIngredient = () => ({ name: '', quantity: '', unit: '', note: '' })

const defaults = (user) => ({
  name: '',
  description: '',
  prep_minutes: 10,
  cook_minutes: 20,
  difficulty: 'easy',
  meal_category: 'dinner',
  cuisine: '',
  servings: user?.default_servings ?? 2,
  calories: '',
  ingredients: [blankIngredient()],
  steps: [{ body: '' }],
  preview: null,
})

function fromRecipe(r, user) {
  return {
    name: r.name || '',
    description: r.description || '',
    prep_minutes: r.prep_minutes ?? '',
    cook_minutes: r.cook_minutes ?? '',
    difficulty: r.difficulty || 'easy',
    meal_category: r.meal_category || 'dinner',
    cuisine: r.cuisine || '',
    servings: r.servings ?? user?.default_servings ?? 2,
    calories: r.calories ?? '',
    ingredients: (r.ingredients || []).map((i) => ({
      name: i.name,
      quantity: i.quantity ?? '',
      unit: i.unit || '',
      note: i.note || '',
    })),
    steps: (r.steps || []).map((s) => ({ body: s })),
    preview: r.image_url,
  }
}

export default function RecipeEditor() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data, loading, error } = useResource(editing ? `/recipes/${id}` : null, [id])
  const [form, setForm] = useState(null)
  const [file, setFile] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const base = useMemo(
    () => (editing ? (data?.recipe ? fromRecipe(data.recipe, user) : null) : defaults(user)),
    [data, editing, user],
  )

  if (editing && (loading || !base)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton" style={{ height: 34, width: 260 }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 16 }} />
      </div>
    )
  }
  if (editing && error) return <div className="alert alert--error">{error}</div>

  const initial = form ?? base

  function set(key, value) {
    setForm({ ...initial, [key]: value })
    setFieldErrors((e) => ({ ...e, [key]: undefined }))
  }

  function setLine(key, index, patch) {
    setForm({
      ...initial,
      [key]: initial[key].map((row, i) => (i === index ? { ...row, ...patch } : row)),
    })
  }

  function addLine(key, blank) {
    setForm({ ...initial, [key]: [...initial[key], blank] })
  }

  function dropLine(key, index) {
    setForm({ ...initial, [key]: initial[key].filter((_, i) => i !== index) })
  }

  function payload() {
    return {
      name: initial.name.trim(),
      description: initial.description.trim() || null,
      prep_minutes: initial.prep_minutes === '' ? null : Number(initial.prep_minutes),
      cook_minutes: initial.cook_minutes === '' ? null : Number(initial.cook_minutes),
      difficulty: initial.difficulty,
      meal_category: initial.meal_category,
      cuisine: initial.cuisine.trim() || null,
      servings: Number(initial.servings) || 2,
      calories: initial.calories === '' ? null : Number(initial.calories),
      ingredients: initial.ingredients
        .filter((row) => row.name.trim() !== '')
        .map((row) => ({
          name: row.name.trim(),
          quantity: row.quantity === '' ? null : Number(row.quantity),
          unit: row.unit || null,
          note: row.note?.trim() || null,
        })),
      steps: initial.steps.map((row) => row.body.trim()).filter((body) => body !== ''),
      remove_image: removeImage ? 1 : 0,
    }
  }

  function clientErrors() {
    const errs = {}
    if (initial.name.trim().length < 2) errs.name = 'Give it a name you will recognise later.'
    if (initial.ingredients.filter((row) => row.name.trim()).length === 0)
      errs.ingredients = 'Add at least one ingredient so we can match it to your kitchen.'
    if (initial.steps.filter((row) => row.body.trim()).length === 0) errs.steps = 'Add at least one step.'
    return errs
  }

  async function submit(e) {
    e.preventDefault()
    const errs = clientErrors()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      setServerError(Object.values(errs)[0])
      return
    }

    setBusy(true)
    setServerError(null)
    setFieldErrors({})

    const body = payload()

    try {
      let saved
      if (file || removeImage) {
        const fd = new FormData()
        // Bracket notation, not dots: PHP only expands `ingredients[0][name]` into a
        // nested array, so dotted keys arrive as one flat key and the server reports
        // "The ingredients field must be present." even though the rows are filled in.
        Object.entries(body).forEach(([key, value]) => {
          if (value === null || value === undefined) return
          if (Array.isArray(value)) {
            value.forEach((item, i) => {
              if (item && typeof item === 'object') {
                Object.entries(item).forEach(([k, v]) => {
                  if (v !== null && v !== undefined) fd.append(`${key}[${i}][${k}]`, v)
                })
              } else {
                fd.append(`${key}[${i}]`, item)
              }
            })
          } else {
            fd.append(key, value)
          }
        })
        if (file) fd.append('image', file)
        saved = (await api.upload(editing ? `/recipes/${id}` : '/recipes', fd, editing ? 'put' : 'post')).data
      } else if (editing) {
        saved = (await api.put(`/recipes/${id}`, body)).data
      } else {
        saved = (await api.post('/recipes', body)).data
      }

      navigate(`/app/recipes/${saved.recipe.id}`, { replace: true })
    } catch (err) {
      setFieldErrors(err.response?.data?.errors || {})
      setServerError(errorMessage(err, 'We could not save that recipe.'))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <PageHead
        title={editing ? (data?.recipe?.is_mine ? 'Edit your recipe' : 'Edit library recipe') : 'Add your recipe'}
        subtitle={
          editing && !data?.recipe?.is_mine
            ? 'This one came with Crumb, so your changes are shared with every cook.'
            : "The kitchen match works on your recipes exactly like the library's, so log the ingredients."
        }
        action={
          <div className="toolbar" style={{ gap: 10 }}>
            <Link className="btn btn--ghost" to={editing ? `/app/recipes/${id}` : '/app/my-recipes'}>
              Cancel
            </Link>
            <button className="btn btn--accent" type="submit" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Save recipe'}
            </button>
          </div>
        }
      />

      {serverError && <div className="alert alert--error" style={{ marginBottom: 18 }}>{serverError}</div>}

      <div className="editor">
        <div className="editor__stack">
          <div className="card settings-card">
            <div className="field">
              <label className="field__label" htmlFor="name">
                Recipe name
              </label>
              <input
                id="name"
                className={`input${fieldErrors.name ? ' input--invalid' : ''}`}
                value={initial.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Eg. Sunday tomato rice"
                autoFocus
              />
              {fieldErrors.name && <span className="field__error">{fieldErrors.name}</span>}
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label className="field__label" htmlFor="description">
                A line about it
              </label>
              <textarea
                id="description"
                className="textarea"
                value={initial.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Weeknight favourite, ready in 30 minutes, leftovers reheat well."
              />
              <span className="field__hint">{initial.description.length}/600</span>
            </div>
          </div>

          <div className="card settings-card">
            <div className="settings-card__head" style={{ marginBottom: 12 }}>
              <div className="settings-card__icon">
                <IconPlus size={17} />
              </div>
              <div>
                <h3>Ingredients</h3>
                <p>Names matter — that is how Crumb matches your kitchen.</p>
              </div>
            </div>

            <div className="form-grid" style={{ gap: 8 }}>
              {initial.ingredients.map((row, i) => (
                <div className="ing-row" key={i}>
                  <input
                    className={`input${fieldErrors[`ingredients.${i}.name`] ? ' input--invalid' : ''}`}
                    placeholder="Eg. Onion"
                    value={row.name}
                    onChange={(e) => setLine('ingredients', i, { name: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="1"
                    inputMode="decimal"
                    value={row.quantity}
                    onChange={(e) => setLine('ingredients', i, { quantity: e.target.value })}
                  />
                  <select
                    className="select"
                    value={row.unit}
                    onChange={(e) => setLine('ingredients', i, { unit: e.target.value })}
                    aria-label={`Unit for ingredient ${i + 1}`}
                  >
                    {UNITS.map((u) => (
                      <option key={u || 'none'} value={u}>
                        {u || 'no unit'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="ing-row__x"
                    onClick={() => dropLine('ingredients', i)}
                    aria-label={`Remove ingredient ${i + 1}`}
                    disabled={initial.ingredients.length === 1}
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ))}
            </div>

            {fieldErrors.ingredients && (
              <span className="field__error" style={{ marginTop: 8 }}>
                {fieldErrors.ingredients}
              </span>
            )}

            <button type="button" className="btn btn--soft btn--sm" style={{ marginTop: 12 }} onClick={() => addLine('ingredients', blankIngredient())}>
              <IconPlus size={14} /> Another ingredient
            </button>
          </div>

          <div className="card settings-card">
            <div className="settings-card__head" style={{ marginBottom: 12 }}>
              <div className="settings-card__icon">
                <IconCamera size={17} />
              </div>
              <div>
                <h3>Steps</h3>
                <p>One action per step. Short sentences cook better at arm's length.</p>
              </div>
            </div>

            <div className="form-grid" style={{ gap: 10 }}>
              {initial.steps.map((row, i) => (
                <div className="step-row" key={i}>
                  <span className="step-row__num">{i + 1}</span>
                  <textarea
                    className={`textarea${fieldErrors[`steps.${i}`] ? ' input--invalid' : ''}`}
                    style={{ minHeight: 60 }}
                    placeholder={`Step ${i + 1}`}
                    value={row.body}
                    onChange={(e) => setLine('steps', i, { body: e.target.value })}
                  />
                  <button
                    type="button"
                    className="ing-row__x"
                    onClick={() => dropLine('steps', i)}
                    aria-label={`Remove step ${i + 1}`}
                    disabled={initial.steps.length === 1}
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ))}
            </div>

            {fieldErrors.steps && <span className="field__error" style={{ marginTop: 8 }}>{fieldErrors.steps}</span>}

            <button type="button" className="btn btn--soft btn--sm" style={{ marginTop: 12 }} onClick={() => addLine('steps', { body: '' })}>
              <IconPlus size={14} /> Another step
            </button>
          </div>
        </div>

        <aside className="editor__stack">
          <div className="card settings-card">
            <div className="field">
              <span className="field__label field__label--caps">Photo</span>
              {initial.preview && !file && !removeImage ? (
                <div className="dropzone__preview">
                  <img src={initial.preview} alt="" />
                  <button type="button" className="dropzone__clear" onClick={() => { setRemoveImage(true); setFile(null) }}>
                    Remove
                  </button>
                </div>
              ) : file ? (
                <div className="dropzone__preview">
                  <img src={URL.createObjectURL(file)} alt="" />
                  <button type="button" className="dropzone__clear" onClick={() => setFile(null)}>
                    Change
                  </button>
                </div>
              ) : removeImage && initial.preview ? (
                <div className="form-grid" style={{ gap: 8 }}>
                  <p className="muted">The current photo will be removed on save.</p>
                  <button type="button" className="link" onClick={() => setRemoveImage(false)}>
                    Keep it after all
                  </button>
                </div>
              ) : (
                <label className="dropzone">
                  <span className="dropzone__plus">+</span>
                  Add a photo
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null)
                      setRemoveImage(false)
                    }}
                  />
                </label>
              )}
              <span className="field__hint">JPG, PNG or WEBP up to 4 MB. Skip it — the card still looks good.</span>
            </div>
          </div>

          <div className="card settings-card">
            <div className="form-grid--2">
              <div className="field">
                <label className="field__label" htmlFor="prep">
                  Prep (min)
                </label>
                <input
                  id="prep"
                  className="input"
                  inputMode="numeric"
                  value={initial.prep_minutes}
                  onChange={(e) => set('prep_minutes', e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="cook">
                  Cook (min)
                </label>
                <input
                  id="cook"
                  className="input"
                  inputMode="numeric"
                  value={initial.cook_minutes}
                  onChange={(e) => set('cook_minutes', e.target.value)}
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label className="field__label" htmlFor="difficulty">
                Difficulty
              </label>
              <div className="select-wrap">
                <select
                  id="difficulty"
                  className="select"
                  value={initial.difficulty}
                  onChange={(e) => set('difficulty', e.target.value)}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label className="field__label" htmlFor="category">
                Best for
              </label>
              <div className="select-wrap">
                <select
                  id="category"
                  className="select"
                  value={initial.meal_category}
                  onChange={(e) => set('meal_category', e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid--2" style={{ marginTop: 16 }}>
              <div className="field">
                <label className="field__label" htmlFor="servings">
                  Serves
                </label>
                <input
                  id="servings"
                  className="input"
                  inputMode="numeric"
                  value={initial.servings}
                  onChange={(e) => set('servings', e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="calories">
                  Calories
                </label>
                <input
                  id="calories"
                  className="input"
                  inputMode="numeric"
                  placeholder="optional"
                  value={initial.calories}
                  onChange={(e) => set('calories', e.target.value)}
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label className="field__label" htmlFor="cuisine">
                Cuisine
              </label>
              <input
                id="cuisine"
                className="input"
                placeholder="Eg. Filipino, Levantine, no particular place"
                value={initial.cuisine}
                onChange={(e) => set('cuisine', e.target.value)}
              />
            </div>
          </div>

          <div className="card settings-card">
            <div className="toolbar" style={{ gap: 10 }}>
              <button className="btn btn--accent btn--block" type="submit" disabled={busy}>
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Save recipe'}
              </button>
            </div>
            <p className="field__hint" style={{ marginTop: 10 }}>
              Saved recipes are private to you. Others only ever see what you add to the shared library.
            </p>
          </div>
        </aside>
      </div>
    </form>
  )
}
