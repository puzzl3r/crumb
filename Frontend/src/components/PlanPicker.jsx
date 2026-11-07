import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import { api, errorMessage } from '../lib/api'
import { addDays, fmtDate, isoDate, startOfWeek } from '../lib/hooks'
import { useToast } from '../context/ToastContext'
import { difficultyLabel, minutesLabel } from './RecipeCard'

export const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack']

/**
 * "Add to plan" flow. With a `recipe` prop it asks for day + meal; without one
 * it starts at a recipe chooser and then asks for day + meal.
 */
export default function PlanPicker({ recipe = null, defaultDate, defaultSlot, onClose, onPlanned }) {
  const toast = useToast()
  const [chosen, setChosen] = useState(recipe)
  const [date, setDate] = useState(defaultDate || isoDate(new Date()))
  const [slot, setSlot] = useState(defaultSlot || 'dinner')
  const [busy, setBusy] = useState(false)

  const days = useMemo(() => {
    const start = startOfWeek(new Date(defaultDate || Date.now()))
    return Array.from({ length: 14 }, (_, i) => addDays(start, i))
  }, [defaultDate])

  async function save() {
    setBusy(true)
    try {
      await api.post('/meal-plan', { recipe_id: chosen.id, date, meal_slot: slot })
      toast.success(`${chosen.name} planned for ${fmtDate(date, { weekday: 'short', month: 'short', day: 'numeric' })}`)
      onPlanned?.()
      onClose()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not add that to your plan.'))
      setBusy(false)
    }
  }

  if (!chosen) {
    return (
      <Modal title="Choose a recipe" subtitle="Search your recipes, then pick a day and meal." onClose={onClose} width="560px">
        <RecipeChooser onPick={setChosen} />
      </Modal>
    )
  }

  return (
    <Modal
      title="Add to your plan"
      subtitle={`${chosen.name} — pick a meal and a day.`}
      onClose={onClose}
      width="620px"
      footer={
        <>
          <button className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={save} disabled={busy}>
            {busy ? 'Adding…' : 'Add to plan'}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field">
          <span className="field__label field__label--caps">Meal</span>
          <div className="toolbar">
            {SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip${slot === s ? ' chip--active' : ''}`}
                onClick={() => setSlot(s)}
                style={{ textTransform: 'capitalize', cursor: 'pointer' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label field__label--caps">Day</span>
          <div className="week-strip">
            {days.map((d) => {
              const value = isoDate(d)
              return (
                <button
                  key={value}
                  type="button"
                  className={`card day-card${value === date ? ' is-today' : ''}`}
                  onClick={() => setDate(value)}
                  style={{ minHeight: 78 }}
                >
                  <span className="day-card__dow">{fmtDate(d, { weekday: 'short' })}</span>
                  <span className="day-card__num">{d.getDate()}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

function RecipeChooser({ onPick }) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      api
        .get('/recipes', { q: query, limit: 30 })
        .then(({ data }) => !cancelled && setItems(data.recipes || []))
        .catch(() => !cancelled && setItems([]))
        .finally(() => !cancelled && setLoading(false))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  return (
    <div className="form-grid">
      <input
        className="input"
        placeholder="Search recipes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {loading ? (
        <p className="muted">Loading recipes…</p>
      ) : items.length === 0 ? (
        <p className="muted">No recipes match that search.</p>
      ) : (
        <div className="picker-list">
          {items.map((r) => (
            <button key={r.id} type="button" className="picker-item" onClick={() => onPick(r)}>
              {r.image_url ? <img src={r.image_url} alt="" /> : <span />}
              <span>
                <strong>{r.name}</strong>
                <span className="meta">
                  {minutesLabel(r)} · {difficultyLabel(r.difficulty)} ·{' '}
                  {r.ingredients?.length ?? 0} ingredients
                </span>
              </span>
              <span className="meta--accent">Choose</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
