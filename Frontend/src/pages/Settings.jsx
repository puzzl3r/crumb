import { useEffect, useState } from 'react'
import { Avatar, PageHead } from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api, errorMessage } from '../lib/api'
import { useResource } from '../lib/hooks'
import { DIETARY, MEASUREMENTS, labelFor } from '../lib/options'
import { IconBell, IconCamera, IconCheck, IconLeaf, IconMonitor, IconShield, IconTrash, IconUser, IconX } from '../lib/icons'

const TIMES = [
  { value: 'any', label: 'Any length' },
  { value: 'under_15', label: 'Under 15 minutes' },
  { value: 'under_30', label: 'Under 30 minutes' },
  { value: 'under_45', label: 'Under 45 minutes' },
  { value: 'under_60', label: 'Under an hour' },
]

const NOTIFICATIONS = [
  { key: 'meal_reminders', label: 'Meal reminders', hint: 'A nudge for whatever is planned for today.' },
  { key: 'weekly_inspiration', label: 'Weekly ideas', hint: 'Three recipes matched to your kitchen each week.' },
  { key: 'product_news', label: 'Product news', hint: 'Occasional notes about what is new in Crumb.' },
]

export default function Settings() {
  const { data, loading, error, reload } = useResource('/settings')
  const { setUser, logout } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState(null)
  const [passwords, setPasswords] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!data?.user) return
    setForm({
      name: data.user.name,
      email: data.user.email,
      dietary_preference: data.user.dietary_preference || 'none',
      allergies: (data.user.allergies || []).join(', '),
      household_size: data.user.household_size ?? 2,
      default_servings: data.user.default_servings ?? 2,
      cooking_time_preference: data.user.cooking_time_preference || 'any',
      measurement_unit: data.user.measurement_unit || 'metric',
      notifications: data.user.notifications,
    })
  }, [data])

  if (loading && !form) return <div className="skeleton" style={{ height: 420, borderRadius: 16 }} />
  if (error) return <div className="alert alert--error">{error}</div>
  if (!form) return null

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save() {
    setBusy(true)
    try {
      const { data: res } = await api.put('/settings', {
        ...form,
        allergies: form.allergies
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        household_size: Number(form.household_size),
        default_servings: Number(form.default_servings),
      })
      setUser(res.user)
      toast.success(res.message)
      reload(true)
    } catch (err) {
      toast.error(errorMessage(err, 'Those settings did not save.'))
    } finally {
      setBusy(false)
    }
  }

  async function toggleNotification(key, value) {
    setForm((f) => ({ ...f, notifications: { ...f.notifications, [key]: value } }))
    try {
      const { data: res } = await api.put('/settings', { notifications: { [key]: value } })
      setUser(res.user)
    } catch (err) {
      setForm((f) => ({ ...f, notifications: { ...f.notifications, [key]: !value } }))
      toast.error(errorMessage(err, 'Could not change that.'))
    }
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const { data: res } = await api.upload('/settings/avatar', fd)
      setUser(res.user)
      toast.success(res.message)
    } catch (err) {
      toast.error(errorMessage(err, 'That photo was not accepted.'))
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    if (passwords.password !== passwords.password_confirmation) {
      return toast.error('Those new passwords do not match.')
    }
    setBusy(true)
    try {
      const { data: res } = await api.put('/settings/password', passwords)
      toast.success(res.message)
      setPasswords({ current_password: '', password: '', password_confirmation: '' })
      reload(true)
    } catch (err) {
      toast.error(errorMessage(err, 'The password was not changed.'))
    } finally {
      setBusy(false)
    }
  }

  async function signOutDevice(device) {
    try {
      const { data: res } = await api.delete(`/settings/sessions/${device.id}`)
      toast.success(res.message)
      reload(true)
    } catch (err) {
      toast.error(errorMessage(err, 'That device is still signed in.'))
    }
  }

  return (
    <>
      <PageHead
        title="Settings"
        subtitle={`${data.counts.recipes} recipe${data.counts.recipes === 1 ? '' : 's'} added · ${data.counts.kitchen_items} ingredient${data.counts.kitchen_items === 1 ? '' : 's'} logged`}
      />

      {form.email !== data.user.email && (
        <div className="notice" style={{ marginBottom: 18 }}>
          Saving a new email address signs the verification off, so expect a fresh confirmation link.
        </div>
      )}

      <div className="settings-grid">
        <div className="settings-col">
        <div className="card settings-card">
          <div className="settings-card__head">
            <div className="settings-card__icon">
              <IconUser size={17} />
            </div>
            <div>
              <h3>Your profile</h3>
              <p>How Crumb addresses you and reaches you.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <Avatar user={data.user} large />
            <div className="toolbar" style={{ gap: 8 }}>
              <label className="btn btn--sm btn--soft">
                <IconCamera size={14} /> Change photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
              </label>
              {data.user.avatar_url && (
                <button
                  className="btn btn--sm btn--danger"
                  onClick={async () => {
                    const { data: res } = await api.delete('/settings/avatar')
                    setUser(res.user)
                    toast.success(res.message)
                  }}
                >
                  <IconTrash size={14} /> Remove
                </button>
              )}
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="name">
                Name
              </label>
              <input id="name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="email">
                Email
              </label>
              <div className="auth__row">
                <input id="email" type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} />
                {data.user.email_verified_at ? (
                  <span className="badge badge--cooked" style={{ marginLeft: 10 }}>
                    <IconCheck size={12} /> verified
                  </span>
                ) : (
                  <span className="badge badge--planned" style={{ marginLeft: 10 }}>
                    unverified
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="settings-card__foot">
            <span className="muted">Name, email and photo save together.</span>
            <button className="btn btn--accent btn--sm" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>

        <div className="card settings-card">
          <div className="settings-card__head">
            <div className="settings-card__icon">
              <IconLeaf size={17} />
            </div>
            <div>
              <h3>Cooking preferences</h3>
              <p>These steer every suggestion you see.</p>
            </div>
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
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label className="field__label" htmlFor="allergies">
              Never suggest recipes with
            </label>
            <input
              id="allergies"
              className="input"
              placeholder="peanuts, shellfish…"
              value={form.allergies}
              onChange={(e) => set('allergies', e.target.value)}
            />
            <span className="field__hint">Comma separated. Saved to your profile.</span>
          </div>

          <div className="form-grid--2" style={{ marginTop: 16 }}>
            <div className="field">
              <label className="field__label" htmlFor="household">
                Household
              </label>
              <input
                id="household"
                className="input"
                inputMode="numeric"
                value={form.household_size}
                onChange={(e) => set('household_size', e.target.value)}
              />
              <span className="field__hint">people</span>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="servings">
                Default servings
              </label>
              <input
                id="servings"
                className="input"
                inputMode="numeric"
                value={form.default_servings}
                onChange={(e) => set('default_servings', e.target.value)}
              />
              <span className="field__hint">per planned meal</span>
            </div>
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label className="field__label" htmlFor="time">
              How long do you like cooking?
            </label>
            <div className="select-wrap">
              <select
                id="time"
                className="select"
                value={form.cooking_time_preference}
                onChange={(e) => set('cooking_time_preference', e.target.value)}
              >
                {TIMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="setting-row" style={{ marginTop: 16 }}>
            <div className="setting-row__text">
              <strong>Units</strong>
              <p>How quantities are written for you.</p>
            </div>
            <div className="segmented">
              {MEASUREMENTS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  className={form.measurement_unit === m.value ? 'is-on' : ''}
                  onClick={() => set('measurement_unit', m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-card__foot">
            <span className="muted">Shapes every recipe Crumb suggests.</span>
            <button className="btn btn--accent btn--sm" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save preferences'}
            </button>
          </div>
        </div>

        <div className="card settings-card">
          <div className="settings-card__head">
            <div className="settings-card__icon">
              <IconBell size={17} />
            </div>
            <div>
              <h3>Notifications</h3>
              <p>Each switch saves straight away.</p>
            </div>
          </div>

          {NOTIFICATIONS.map((n) => (
            <div className="setting-row" key={n.key}>
              <div className="setting-row__text">
                <strong>{n.label}</strong>
                <p>{n.hint}</p>
              </div>
              <button
                type="button"
                className="toggle"
                role="switch"
                aria-checked={Boolean(form.notifications?.[n.key])}
                aria-label={n.label}
                onClick={() => toggleNotification(n.key, !form.notifications?.[n.key])}
              />
            </div>
          ))}
        </div>
        </div>

        <div className="settings-col">
        <div className="card settings-card">
          <div className="settings-card__head">
            <div className="settings-card__icon">
              <IconShield size={17} />
            </div>
            <div>
              <h3>Password</h3>
              <p>Changing it signs every other device out.</p>
            </div>
          </div>

          <form className="form-grid" onSubmit={changePassword} noValidate>
            <div className="field">
              <label className="field__label" htmlFor="current">
                Current password
              </label>
              <input
                id="current"
                type="password"
                className="input"
                autoComplete="current-password"
                value={passwords.current_password}
                onChange={(e) => setPasswords((p) => ({ ...p, current_password: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="new">
                New password
              </label>
              <input
                id="new"
                type="password"
                className="input"
                autoComplete="new-password"
                placeholder="8+ characters, letters and numbers"
                value={passwords.password}
                onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="confirm">
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                className="input"
                autoComplete="new-password"
                value={passwords.password_confirmation}
                onChange={(e) => setPasswords((p) => ({ ...p, password_confirmation: e.target.value }))}
              />
            </div>
            <button className="btn btn--primary" type="submit" disabled={busy}>
              Update password
            </button>
          </form>
        </div>

        <div className="card settings-card">
          <div className="settings-card__head">
            <div className="settings-card__icon">
              <IconMonitor size={17} />
            </div>
            <div>
              <h3>Signed-in devices</h3>
              <p>{data.devices.length} live session{data.devices.length === 1 ? '' : 's'}.</p>
            </div>
          </div>

          <div className="form-grid" style={{ gap: 10 }}>
            {data.devices.map((device) => (
              <div className="device" key={device.id}>
                <span className="device__icon">
                  <IconMonitor size={18} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>
                    {device.browser} · {device.platform}
                  </strong>
                  <p>
                    {device.is_current ? 'This device' : `Last active ${formatWhen(device.last_active_at)}`}
                    {device.ip_address ? ` · ${device.ip_address}` : ''}
                  </p>
                </div>
                {device.is_current ? (
                  <span className="chip chip--stocked">in use</span>
                ) : (
                  <button className="link link--danger" onClick={() => signOutDevice(device)}>
                    Sign out
                  </button>
                )}
              </div>
            ))}
            {data.devices.length === 0 && <p className="muted">No other sessions found.</p>}
          </div>
        </div>

        <div className="card settings-card">
          <div className="settings-card__head">
            <div className="settings-card__icon" style={{ background: 'var(--red-100)', color: 'var(--red-600)' }}>
              <IconX size={17} />
            </div>
            <div>
              <h3>Account</h3>
              <p>
                {labelFor(DIETARY, form.dietary_preference)} · {labelFor(MEASUREMENTS, form.measurement_unit).toLowerCase()} units
              </p>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-row__text">
              <strong>Sign out of Crumb</strong>
              <p>Ends this session on this device.</p>
            </div>
            <button className="btn btn--outline btn--sm" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}

function formatWhen(iso) {
  const then = new Date(iso)
  const mins = Math.round((Date.now() - then.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`
  return then.toLocaleDateString()
}
