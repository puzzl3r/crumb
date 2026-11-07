import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/api'
import { DIETARY } from '../lib/options'

function strengthOf(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

export default function Signup() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    dietary_preference: 'none',
    terms: false,
  })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const score = strengthOf(form.password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][score] || ''

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    setFieldErrors((e) => ({ ...e, [key]: undefined }))
  }

  function clientValidate() {
    const errs = {}
    if (form.name.trim().length < 2) errs.name = 'Tell us what to call you.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'That email address looks incomplete.'
    if (form.password.length < 8) errs.password = 'Use at least 8 characters.'
    if (form.password !== form.password_confirmation) errs.password_confirmation = 'Passwords do not match.'
    if (!form.terms) errs.terms = 'Please accept the Terms to continue.'
    return errs
  }

  async function submit(e) {
    e.preventDefault()
    const errs = clientValidate()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      setError(Object.values(errs)[0])
      return
    }
    setBusy(true)
    setError(null)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        dietary_preference: form.dietary_preference,
      })
      navigate('/app', { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setFieldErrors(data.errors)
      setError(errorMessage(err, 'We could not create that account.'))
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      headline={
        <>
          Start with what
          <br />
          you already have.
        </>
      }
      lede="Create a free account to save recipes, plan your week, and cook with the ingredients in your kitchen."
      title="Create your account"
      subtitle="A few details and you're cooking."
      foot={
        <p className="auth__foot-note">
          Already have an account?{' '}
          <Link to="/login" className="link">
            Log in
          </Link>
        </p>
      }
    >
      <form className="auth__form" onSubmit={submit} noValidate>
        {error && <div className="alert alert--error">{error}</div>}

        <div className="field">
          <label className="field__label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            className={`input${fieldErrors.name ? ' input--invalid' : ''}`}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Archer Bennett"
            autoComplete="name"
          />
          {fieldErrors.name && <span className="field__error">{fieldErrors.name}</span>}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className={`input${fieldErrors.email ? ' input--invalid' : ''}`}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {fieldErrors.email && <span className="field__error">{fieldErrors.email}</span>}
        </div>

        <div className="field">
          <div className="auth__row">
            <label className="field__label" htmlFor="password">
              Password
            </label>
            <button type="button" className="link" onClick={() => setShow((s) => !s)}>
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            id="password"
            type={show ? 'text' : 'password'}
            className={`input${fieldErrors.password ? ' input--invalid' : ''}`}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
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
          {fieldErrors.password && <span className="field__error">{fieldErrors.password}</span>}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="password_confirmation">
            Confirm password
          </label>
          <input
            id="password_confirmation"
            type={show ? 'text' : 'password'}
            className={`input${fieldErrors.password_confirmation ? ' input--invalid' : ''}`}
            value={form.password_confirmation}
            onChange={(e) => set('password_confirmation', e.target.value)}
            placeholder="Type it once more"
            autoComplete="new-password"
          />
          {fieldErrors.password_confirmation && (
            <span className="field__error">{fieldErrors.password_confirmation}</span>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="dietary">
            Dietary preference
          </label>
          <div className="select-wrap">
            <select
              id="dietary"
              className="select"
              value={form.dietary_preference}
              onChange={(e) => set('dietary_preference', e.target.value)}
            >
              {DIETARY.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <span className="field__hint">We use this to tailor recipe ideas. Change it any time.</span>
        </div>

        <div className="field">
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: 'var(--ink-600)' }}>
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => set('terms', e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span>
              I agree to Crumb's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </span>
          </label>
          {fieldErrors.terms && <span className="field__error">{fieldErrors.terms}</span>}
        </div>

        <button className="btn btn--accent btn--block btn--lg" disabled={busy} type="submit">
          {busy ? 'Creating your account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
