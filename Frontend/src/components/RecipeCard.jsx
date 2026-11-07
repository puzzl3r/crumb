import { Link } from 'react-router-dom'
import FoodImage from './FoodImage'
import { IconCheck } from '../lib/icons'

export function minutesLabel(recipe) {
  const total = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0)
  return total > 0 ? `${total} min` : '—'
}

export function difficultyLabel(value) {
  return { easy: 'Easy', medium: 'Medium', hard: 'Hard' }[value] || 'Easy'
}

export default function RecipeCard({ recipe, actions, match }) {
  return (
    <article className="card recipe-card">
      <Link to={`/app/recipes/${recipe.id}`} className="recipe-card__img" aria-label={recipe.name}>
        <FoodImage src={recipe.image_url} alt={recipe.name} />
      </Link>
      <div className="recipe-card__body">
        <h3 className="recipe-card__title">
          <Link to={`/app/recipes/${recipe.id}`}>{recipe.name}</Link>
        </h3>
        <div className="meta">
          {minutesLabel(recipe)} · {difficultyLabel(recipe.difficulty)}
        </div>

        {match != null ? (
          <div className="meta--accent" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <IconCheck size={13} /> {match} of {recipe.ingredients?.length ?? recipe.ingredient_count} ingredients
            match
          </div>
        ) : (
          recipe.ingredients?.length > 0 && (
            <div className="meta--accent">Uses {recipe.ingredients.length} ingredients</div>
          )
        )}

        {actions && <div className="recipe-card__actions">{actions}</div>}
      </div>
    </article>
  )
}

export function CompactRecipeCard({ recipe, onAddToPlan }) {
  return (
    <article className="card recipe-card">
      <Link to={`/app/recipes/${recipe.id}`} className="recipe-card__img" style={{ height: 108 }} aria-label={recipe.name}>
        <FoodImage src={recipe.image_url} alt={recipe.name} />
      </Link>
      <div className="recipe-card__body">
        <h3 className="recipe-card__title">
          <Link to={`/app/recipes/${recipe.id}`}>{recipe.name}</Link>
        </h3>
        <div className="meta">
          {minutesLabel(recipe)} · {difficultyLabel(recipe.difficulty)}
        </div>
        <div className="recipe-card__foot">
          {onAddToPlan ? (
            <button className="link" onClick={() => onAddToPlan(recipe)}>
              + Add to plan
            </button>
          ) : (
            <Link className="link" to={`/app/recipes/${recipe.id}`}>
              View recipe
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
