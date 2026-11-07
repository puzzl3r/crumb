import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FoodImage from '../components/FoodImage'
import PlanPicker from '../components/PlanPicker'
import RecipeCard, { difficultyLabel, minutesLabel } from '../components/RecipeCard'
import { useResource } from '../lib/hooks'
import { IconArrowRight, IconCheck, IconClock, IconLeaf, IconPlanner, IconSpark } from '../lib/icons'

export default function Dashboard() {
  const { data, loading, error, reload } = useResource('/dashboard')
  const [planning, setPlanning] = useState(null)
  const navigate = useNavigate()

  if (loading) return <DashboardSkeleton />
  if (error) return <div className="alert alert--error">{error}</div>

  const { greeting, first_name: firstName, today, suggestions, coming_up: comingUp, stats, needs_attention: attention } = data

  return (
    <>
      <section className="hero">
        <div>
          <div className="hero__eyebrow">
            {greeting}, {firstName}
          </div>
          <h2>What are we making today?</h2>
          <p>
            You have {stats.kitchen_items} ingredients logged. {suggestions[0]?.recipe?.name} uses{' '}
            {suggestions[0]?.matched} of them — {today.entries.length ? 'and dinner is already planned.' : 'nothing is planned for today yet.'}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn--cream" onClick={() => navigate('/app/ingredients')}>
              <IconLeaf size={16} /> Cook with what I have
            </button>
            <button className="btn btn--cream" onClick={() => navigate('/app/planner')}>
              <IconPlanner size={16} /> Open meal planner
            </button>
          </div>
        </div>
        <div className="hero__figure">
          {suggestions[0]?.recipe ? (
            <Link to={`/app/recipes/${suggestions[0].recipe.id}`} style={{ display: 'block', height: '100%' }}>
              <FoodImage src={suggestions[0].recipe.image_url} alt={suggestions[0].recipe.name} />
            </Link>
          ) : (
            <FoodImage alt="crumb" />
          )}
        </div>
      </section>

      <div className="stats section">
        <Stat label="Planned this week" value={stats.planned_this_week} unit="meals" />
        <Stat label="Cooked" value={stats.cooked_this_week} unit="meals" />
        <Stat label="In your kitchen" value={stats.kitchen_items} unit="ingredients" />
        <Stat label="Your recipes" value={stats.my_recipes} unit="recipes" />
      </div>

      {(attention.kitchen_is_empty || attention.no_recipes || attention.nothing_planned) && (
        <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {attention.kitchen_is_empty && (
            <Nudge
              text="Your kitchen is empty. Log a few staples and Crumb starts matching recipes to them."
              action={
                <Link className="btn btn--sm btn--outline" to="/app/ingredients">
                  Add ingredients
                </Link>
              }
            />
          )}
          {attention.nothing_planned && (
            <Nudge
              text="Nothing planned for this week yet — five minutes now saves a lot of tonight."
              action={
                <Link className="btn btn--sm btn--outline" to="/app/planner">
                  Plan a week
                </Link>
              }
            />
          )}
          {attention.no_recipes && (
            <Nudge
              text="You haven't saved a recipe of your own yet. Add the one your family always asks for."
              action={
                <Link className="btn btn--sm btn--outline" to="/app/recipes/new">
                  Add your recipe
                </Link>
              }
            />
          )}
        </div>
      )}

      <section className="section">
        <div className="section__head">
          <div>
            <h2>Made for your kitchen</h2>
            <p>Ranked by how much you already have.</p>
          </div>
          <Link className="link" to="/app/recipes">
            Browse all recipes <IconArrowRight size={14} />
          </Link>
        </div>

        <div className="grid-3">
          {suggestions.map(({ recipe, matched, total, missing }) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              match={matched}
              actions={
                <>
                  <button className="btn btn--sm btn--soft" onClick={() => setPlanning(recipe)}>
                    + Plan
                  </button>
                  <span className="meta">
                    {total - matched > 0 ? `Missing ${total - matched}: ${missing.slice(0, 2).join(', ')}` : 'You have everything'}
                  </span>
                </>
              }
            />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <div>
            <h2>Today</h2>
            <p>{today.label}</p>
          </div>
          <Link className="link" to="/app/planner">
            Edit the week
          </Link>
        </div>

        <div className="card">
          {today.entries.length === 0 ? (
            <div className="empty" style={{ border: 0, background: 'transparent' }}>
              <strong>Nothing on the menu yet</strong>
              Pick a recipe and give it a slot — breakfast through snack.
              <div style={{ marginTop: 14 }}>
                <button className="btn btn--sm btn--accent" onClick={() => setPlanning({})}>
                  Plan something
                </button>
              </div>
            </div>
          ) : (
            today.entries.map((entry) => (
              <div className="plan-row" key={entry.id}>
                <div className="plan-row__day">
                  {entry.meal_slot}
                  {entry.cooked_at && <small>{new Date(entry.cooked_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</small>}
                </div>
                <Link className="plan-row__meal" to={`/app/recipes/${entry.recipe.id}`}>
                  {entry.recipe.name}
                  <div className="meta">
                    {minutesLabel(entry.recipe)} · {difficultyLabel(entry.recipe.difficulty)}
                  </div>
                </Link>
                <div className="plan-row__check">
                  <IconClock size={14} /> {entry.recipe.ingredients?.length ?? 0} ingredients
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {entry.status === 'cooked' ? (
                    <span className="badge badge--cooked">
                      <IconCheck size={12} /> Cooked
                    </span>
                  ) : (
                    <span className="badge badge--planned">Planned</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <div>
            <h2>Coming up</h2>
            <p>The next five days.</p>
          </div>
        </div>
        <div className="week-strip">
          {comingUp.map((day) => (
            <Link key={day.date} to="/app/planner" className={`card day-card${day.is_today ? ' is-today' : ''}`}>
              <span className="day-card__dow">{day.is_today ? 'Today' : day.day}</span>
              <span className="day-card__num">{day.day_number}</span>
              {day.meal ? (
                <span className="day-card__meal">
                  {day.meal}
                  {day.status === 'cooked' ? ' · cooked' : ''}
                </span>
              ) : (
                <span className="day-card__empty">Open</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      <div className="cta-band">
        <div>
          <h3>
            <IconSpark size={16} /> Have a recipe worth keeping?
          </h3>
          <p>Add it once and Crumb will match it against your kitchen like any other.</p>
        </div>
        <Link className="btn btn--accent" to="/app/recipes/new">
          Add your recipe
        </Link>
      </div>

      {planning && (
        <PlanPicker
          recipe={planning.id ? planning : null}
          defaultDate={today.date}
          onClose={() => setPlanning(null)}
          onPlanned={() => reload(true)}
        />
      )}
    </>
  )
}

function Stat({ label, value, unit }) {
  return (
    <div className="card stat">
      <div className="stat__label">{label}</div>
      <div className="stat__value">
        {value} <small>{value === 1 ? unit.replace(/s$/, '') : unit}</small>
      </div>
    </div>
  )
}

function Nudge({ text, action }) {
  return (
    <div className="notice">
      <span style={{ flex: 1 }}>{text}</span>
      {action}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div className="skeleton" style={{ height: 148, borderRadius: 22 }} />
      <div className="stats section">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card stat">
            <div className="skeleton" style={{ height: 12, width: '60%' }} />
            <div className="skeleton" style={{ height: 24, width: '40%', marginTop: 8 }} />
          </div>
        ))}
      </div>
      <div className="grid-3 section">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 230 }} />
        ))}
      </div>
    </>
  )
}
