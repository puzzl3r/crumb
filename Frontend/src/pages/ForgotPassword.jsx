import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { api, errorMessage } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('That email address looks incomplete.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() })
      setSent(data)
    } catch (err) {
      setError(errorMessage(err, 'We could not send that link right now.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      headline={
        <>
          Lost a password?
          <br />
          Not the good food.
        </>
      }
      lede="Tell us the address you signed up with and we'll send a link to set a new password."
      title="Forgot your password?"
      subtitle="It happens to the best cooks."
      foot={
        <p className="auth__foot-note">
          Remembered it?{' '}
          <Link to="/login" className="link">
            Back to log in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="auth__form">
          <div className="alert alert--success">{sent.message}</div>
          <p className="field__hint">
            The link expires in 60 minutes. Check your spam folder if it hasn't landed — or send
            another.
          </p>

          {sent.debug_reset_link && (
            <div className="notice">
              Local dev: no mail server here, so{' '}
              <a href={sent.debug_reset_link}>open the reset link</a> directly.
            </div>
          )}

          <button className="btn btn--outline btn--block" onClick={() => setSent(null)} disabled={busy}>
            Send to a different address
          </button>
        </div>
      ) : (
        <form className="auth__form" onSubmit={submit} noValidate>
          {error && <div className="alert alert--error">{error}</div>}

          <div className="field">
            <label className="field__label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className={`input${error ? ' input--invalid' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
          </div>

          <button className="btn btn--accent btn--block btn--lg" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Email me a reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
