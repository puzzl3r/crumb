import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../components/AppShell'
import FoodImage from '../components/FoodImage'
import Modal from '../components/Modal'
import PlanPicker, { SLOTS } from '../components/PlanPicker'
import { api, errorMessage } from '../lib/api'
import { useResource, addDays, isoDate, startOfWeek } from '../lib/hooks'
import { labelFor, CATEGORIES } from '../lib/options'
import { IconCheck, IconPlus, IconX } from '../lib/icons'

export default function MealPlanner() {
  const [offset, setOffset] = useState(0)
  const [picking, setPicking] = useState(null)
  const [opened, setOpened] = useState(null)

  const weekStart = useMemo(() => addDays(startOfWeek(new Date()), offset * 7), [offset])
  const url = useMemo(() => `/meal-plan?week_start=${isoDate(weekStart)}`, [weekStart])

  const { data, loading, error, reload } = useResource(url)

  async function act(entry, action) {
    try {
      if (action === 'unplan') await api.delete(`/meal-plan/${entry.id}`)
      else
        await api.put(`/meal-plan/${entry.id}`, {
          status: action === 'cooked' ? 'cooked' : 'planned',
        })
      setOpened(null)
      reload(true)
    } catch (err) {
      window.alert(errorMessage(err, 'That change did not stick.'))
    }
  }

  return (
    <>
      <PageHead
        title="Meal planner"
        subtitle={
          data
            ? `${data.summary.planned} planned · ${data.summary.cooked} cooked this week`
            : 'Drag your week into shape, one meal at a time.'
        }
        action={
          <button className="btn btn--accent" onClick={() => setPicking({ date: isoDate(new Date()) })}>
            <IconPlus size={15} /> Plan a meal
          </button>
        }
      />

      <div className="week-nav" style={{ marginBottom: 18 }}>
        <button className="btn btn--outline btn--sm" onClick={() => setOffset((o) => o - 1)}>
          ← Prev
        </button>
        <div className="week-nav__label">{data?.week?.label || 'Loading…'}</div>
        <button className="btn btn--outline btn--sm" onClick={() => setOffset((o) => o + 1)}>
          Next →
        </button>
        {offset !== 0 && (
          <button className="link link--muted" onClick={() => setOffset(0)}>
            Jump to this week
          </button>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {loading && !data ? (
        <div className="skeleton" style={{ height: 420, borderRadius: 16 }} />
      ) : (
        data && (
          <div className="planner">
            {data.days.map((day) => (
              <div key={day.date} className={`planner__day${day.is_today ? ' is-today' : ''}`}>
                <div className="planner__dayhead">
                  <div className="dow">{day.is_today ? 'Today' : day.label}</div>
                  <div className="num">{day.day_number}</div>
                  <div className="meta">{day.month}</div>
                </div>

                {SLOTS.map((slot) => (
                  <div className="slot" key={slot}>
                    <div className="slot__label">{slot}</div>
                    {day.slots[slot].map((entry) => (
                      <div
                        key={entry.id}
                        className={`meal-tile${entry.status === 'cooked' ? ' meal-tile--cooked' : ''}`}
                        onClick={() => setOpened({ entry, day })}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setOpened({ entry, day })}
                      >
                        <div className="meal-tile__img">
                          <FoodImage src={entry.recipe?.image_url} alt={entry.recipe?.name} />
                        </div>
                        <div className="meal-tile__caption">
                          <span>{entry.recipe?.name}</span>
                          {entry.status === 'cooked' && (
                            <span className="meal-tile__status meal-tile__status--cooked">
                              <IconCheck size={12} /> cooked
                            </span>
                          )}
                        </div>
                        <button
                          className="meal-tile__remove"
                          aria-label="Remove from plan"
                          onClick={(e) => {
                            e.stopPropagation()
                            act(entry, 'unplan')
                          }}
                        >
                          <IconX size={12} />
                        </button>
                      </div>
                    ))}

                    {day.slots[slot].length === 0 && (
                      <button
                        className="slot__empty"
                        onClick={() => setPicking({ date: day.date, slot })}
                      >
                        + {slot}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      )}

      <div className="card planner__legend">
        <span>
          <span className="badge badge--planned">Planned</span> still to cook
        </span>
        <span>
          <span className="badge badge--cooked">
            <IconCheck size={12} /> Cooked
          </span> on the table
        </span>
        <p>Tap an empty box to plan, or a meal to change it. Nothing here is locked in.</p>
      </div>

      {picking && (
        <PlanPicker
          defaultDate={picking.date}
          defaultSlot={picking.slot}
          onClose={() => setPicking(null)}
          onPlanned={() => {
            reload(true)
            setOffset(0)
          }}
        />
      )}

      {opened && (
        <Modal
          title={opened.entry.recipe?.name}
          subtitle={`${opened.day.label} ${opened.day.day_number} · ${opened.entry.meal_slot}`}
          onClose={() => setOpened(null)}
          footer={
            <>
              <button className="btn btn--danger" onClick={() => act(opened.entry, 'unplan')}>
                Remove
              </button>
              <button
                className="btn btn--outline"
                onClick={() => act(opened.entry, opened.entry.status === 'cooked' ? 'planned' : 'cooked')}
              >
                {opened.entry.status === 'cooked' ? 'Mark as planned' : 'Mark as cooked'}
              </button>
              <Link className="btn btn--primary" to={`/app/recipes/${opened.entry.recipe?.id}`}>
                Open recipe
              </Link>
            </>
          }
        >
          <div className="detail__meta">
            <span className="pill-meta">{labelFor(CATEGORIES, opened.entry.meal_slot)}</span>
            <span className="pill-meta">{opened.entry.servings ?? opened.entry.recipe?.servings} servings</span>
            <span className="pill-meta">
              {(opened.entry.recipe?.prep_minutes || 0) + (opened.entry.recipe?.cook_minutes || 0)} min
            </span>
          </div>
          <p className="muted">{opened.entry.recipe?.description}</p>
          <div style={{ marginTop: 14 }}>
            <div className="field__label field__label--caps" style={{ marginBottom: 8 }}>
              You may still need
            </div>
            <div className="kitchen__chips">
              {(opened.entry.recipe?.kitchen_match?.missing || []).length === 0 ? (
                <span className="chip chip--stocked">Everything is in the kitchen</span>
              ) : (
                opened.entry.recipe.kitchen_match.missing.map((name) => (
                  <span className="chip chip--missing" key={name}>
                    {name}
                  </span>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
