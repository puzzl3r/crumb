import axios from 'axios'

export const http = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

let csrfPromise = null

/** Sanctum's SPA flow needs the XSRF-TOKEN cookie before any state-changing call. */
export function csrfToken() {
  if (!csrfPromise) {
    csrfPromise = axios
      .get('/sanctum/csrf-cookie', { withCredentials: true })
      .then(() => readXsrfCookie())
      .catch((err) => {
        csrfPromise = null
        throw err
      })
  }
  return csrfPromise
}

function readXsrfCookie() {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

async function request(config) {
  await csrfToken()
  try {
    return await http({ ...config, headers: { ...config.headers, 'X-XSRF-TOKEN': readXsrfCookie() } })
  } catch (err) {
    // Signing in, resetting a password or simply leaving the tab open can rotate
    // the session, which leaves the browser holding a stale token. Re-bootstrap
    // once rather than surfacing "CSRF token mismatch" to the user.
    if (err.response?.status !== 419) throw err
    csrfPromise = null
    await csrfToken()
    return http({ ...config, headers: { ...config.headers, 'X-XSRF-TOKEN': readXsrfCookie() } })
  }
}

export const api = {
  get: (url, params) => http.get(url, { params }),
  post: (url, data) => request({ url, method: 'post', data }),
  put: (url, data) => request({ url, method: 'put', data }),
  patch: (url, data) => request({ url, method: 'patch', data }),
  delete: (url) => request({ url, method: 'delete' }),
  upload: (url, form, method = 'post') =>
    request({ url, method, data: form, headers: { 'Content-Type': 'multipart/form-data' } }),
}

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback
  const data = err.response?.data
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first) && first[0]) return first[0]
  }
  if (data?.message) return data.message
  if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the Laravel backend running?'
  return fallback
}
