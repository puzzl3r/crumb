import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { api, errorMessage } from '../lib/api'

function strengthOf(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [form, setForm] = useState({
    email: params.get('email') || '',
    password: '',
    password_confirmation: '',
  })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const score = strengthOf(form.password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][score] || ''

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    setError(null)
  }

  async function submit(e) {
    e.preventDefault()
    if (form.password.length < 8) return setError('Use at least 8 characters.')
    if (form.password !== form.password_confirmation) return setError('Those passwords do not match.')

    setBusy(true)
    setError(null)
    try {
      const { data } = await api.post('/auth/reset-password', {
        token,
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
      navigate('/login', { replace: true, state: { reset: true, message: data.message } })
    } catch (err) {
      setError(errorMessage(err, 'We could not reset that password.'))
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout
        headline={
          <>
            That link looks
            <br />
            incomplete.
          </>
        }
        lede="Reset links are single-use and time-limited, so a trimmed or reused one won't work."
        title="No reset token found"
        subtitle="Ask for a fresh link and open it straight from the email."
        foot={
          <p className="auth__foot-note">
            <Link to="/login" className="link">
              Back to log in
            </Link>
          </p>
        }
      >
        <Link to="/forgot-password" className="btn btn--accent btn--block btn--lg">
          Send a new reset link
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      headline={
        <>
          Pick something
          <br />
          you'll remember.
        </>
      }
      lede="Choose a new password for this address. Every other device will be signed out as a precaution."
      title="Choose a new password"
      subtitle="One step and you're back in."
      foot={
        <p className="auth__foot-note">
          Changed your mind?{' '}
          <Link to="/login" className="link">
            Return to log in
          </Link>
        </p>
      }
    >
      <form className="auth__form" onSubmit={submit} noValidate>
        {error && <div className="alert alert--error">{error}</div>}

        <div className="field">
          <label className="field__label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="email"
          />
          <span className="field__hint">This came from your reset link — keep it as is.</span>
        </div>

        <div className="field">
          <div className="auth__row">
            <label className="field__label" htmlFor="password">
              New password
            </label>
            <button type="button" className="link" onClick={() => setShow((s) => !s)}>
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            id="password"
            type={show ? 'text' : 'password'}
            className="input"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            autoFocus
          />
          {form.password && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="meter" style={{ maxWidth: 160, height: 4 }}>
                <div
                  className={`meter__fill${score < 3 ? ' meter__fill--partial' : ''}`}
                  style={{ width: `${(score / 4) * 100}%` }}
                />
              </div>
              <span className="field__hint">{strengthLabel}</span>
            </div>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="password_confirmation">
            Confirm new password
          </label>
          <input
            id="password_confirmation"
            type={show ? 'text' : 'password'}
            className="input"
            value={form.password_confirmation}
            onChange={(e) => set('password_confirmation', e.target.value)}
            placeholder="Type it once more"
            autoComplete="new-password"
          />
        </div>

        <button className="btn btn--accent btn--block btn--lg" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  )
}
