/** Mirrors the allow-lists in Backend/config/crumb.php. */

export const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

export const CATEGORIES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'dessert', label: 'Dessert' },
]

export const DIETARY = [
  { value: 'none', label: 'No restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten-free' },
  { value: 'dairy_free', label: 'Dairy-free' },
  { value: 'pescatarian', label: 'Pescatarian' },
]

export const TIME_FILTERS = [
  { value: '', label: 'Any length' },
  { value: 'under_15', label: 'Under 15 min' },
  { value: 'under_30', label: 'Under 30 min' },
  { value: 'under_45', label: 'Under 45 min' },
  { value: 'under_60', label: 'Under an hour' },
]

export const SORTS = [
  { value: '', label: 'Most relevant' },
  { value: 'quick', label: 'Quickest first' },
  { value: 'recent', label: 'Newest' },
  { value: 'name', label: 'A–Z' },
]

export const MEASUREMENTS = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
]

export const UNITS = ['', 'g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cup', 'oz', 'lb', 'piece', 'clove', 'handful']

export const labelFor = (options, value) => options.find((o) => o.value === value)?.label || value

/** "3 pieces" / "1 piece" / "0.25 cup". Stored units are plural, so singularise at 1. */
export function formatQuantity({ quantity, unit }) {
  const hasQty = quantity !== null && quantity !== undefined && quantity !== ''
  const q = hasQty ? Number(quantity) : null
  const u = (unit || '').trim()
  // tbsp/tsp never end in "s", so the strip is safe for every unit we offer.
  const label = q === 1 && /s$/i.test(u) ? u.replace(/s$/i, '') : u
  if (!label) return q === null ? '' : String(q)
  return q === null ? label : `${q} ${label}`
}
