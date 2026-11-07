const tints = [
  ['#f1e7d8', '#e7dbc6', '#c1683c'],
  ['#eaf3e6', '#dcead5', '#4e6b4a'],
  ['#f6e5d8', '#f1e7d8', '#a9562f'],
  ['#f5ecd9', '#ecdfc4', '#71553f'],
]

function hash(text = '') {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 9973
  return h
}

/**
 * A recipe photo when there is one, and a warm plate drawn in SVG when there
 * isn't — so an unphotographed recipe reads as "waiting" rather than "broken".
 */
export default function FoodImage({ src, alt = '', rounded }) {
  if (src) return <img src={src} alt={alt} loading="lazy" />

  const [bg, ring, mark] = tints[hash(alt) % tints.length]

  return (
    <svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block', borderRadius: rounded || 0 }}>
      <rect width="120" height="90" fill={bg} />
      <circle cx="60" cy="45" r="27" fill="none" stroke={ring} strokeWidth="7" />
      <circle cx="60" cy="45" r="15" fill="none" stroke={mark} strokeWidth="2.4" />
      <path d="M28 24v14M25 24v7M31 24v7" stroke={mark} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      <path d="M92 26v12" stroke={mark} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  )
}
