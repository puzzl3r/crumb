import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const justRegistered = location.state?.registered
  const justReset = location.state?.reset

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(form)
      navigate(location.state?.from || '/app', { replace: true })
    } catch (err) {
      setError(errorMessage(err, "We couldn't sign you in. Check your email and password."))
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      headline={
        <>
          A little inspiration.
          <br />
          A lot of good food.
        </>
      }
      lede="Plan your meals, discover recipes, and make the most of what's already in your kitchen."
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      foot={
        <>
          <div className="auth__split">or</div>
          <p className="auth__foot-note">
            New to Crumb?{' '}
            <Link to="/signup" className="link">
              Create an account
            </Link>
          </p>
          <p className="auth__legal">
            By continuing, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
          </p>
        </>
      }
    >
      <form className="auth__form" onSubmit={submit} noValidate>
        {justRegistered && (
          <div className="alert alert--success">Account created. Sign in to start planning.</div>
        )}
        {justReset && <div className="alert alert--success">Password updated. You're good to go.</div>}
        {error && <div className="alert alert--error">{error}</div>}

        <div className="field">
          <label className="field__label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
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
            className="input"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--ink-600)' }}>
          <input
            type="checkbox"
            checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
          />
          Keep me signed in on this device
        </label>

        <div style={{ textAlign: 'right', marginTop: -8 }}>
          <Link to="/forgot-password" className="link" style={{ fontSize: 12.5 }}>
            Forgot password?
          </Link>
        </div>

        <button className="btn btn--primary btn--block btn--lg" disabled={busy} type="submit">
          {busy ? 'Signing in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  )
}
