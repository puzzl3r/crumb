import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../lib/api'

/** Load once, then reload on demand. `deps` re-triggers the fetch. A falsy url skips the request. */
export function useResource(url, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(Boolean(url))

  const load = useCallback(
    async (silent = false) => {
      if (!url) {
        setLoading(false)
        return
      }
      if (!silent) setLoading(true)
      try {
        const res = await api.get(url)
        setData(res.data)
        setError(null)
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setLoading(false)
      }
    },
    [url],
  )

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps])

  return { data, error, loading, reload: load, setData }
}

/** Small debounced value helper for search inputs. */
export function useDebounced(value, delay = 320) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export function greetingForNow() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function isoDate(d) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return z.toISOString().slice(0, 10)
}

export function startOfWeek(d) {
  const copy = new Date(d)
  const day = (copy.getDay() + 6) % 7 // Monday = 0
  copy.setDate(copy.getDate() - day)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function addDays(d, n) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

export function fmtDate(d, opts = { month: 'short', day: 'numeric' }) {
  return new Date(d).toLocaleDateString('en-US', opts)
}
