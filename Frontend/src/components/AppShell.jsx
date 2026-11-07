import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  IconDashboard,
  IconLeaf,
  IconLogout,
  IconPlanner,
  IconPlus,
  IconRecipes,
  IconSettings,
  IconSpark,
} from '../lib/icons'

const workspace = [
  { to: '/app', end: true, label: 'Dashboard', Icon: IconDashboard },
  { to: '/app/recipes', label: 'Recipes', Icon: IconRecipes },
  { to: '/app/planner', label: 'Meal Planner', Icon: IconPlanner },
  { to: '/app/my-recipes', label: 'My Recipes', Icon: IconPlus },
  { to: '/app/ingredients', label: 'Ingredients', Icon: IconLeaf },
  { to: '/app/settings', label: 'Settings', Icon: IconSettings },
]

function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'C'
  )
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // The dashboard hero and the recipe pages' own headers already own the top-right,
  // so a floating chip there reads as an overlap bug.
  const floatingAvatar = pathname !== '/app' && !pathname.startsWith('/app/recipes/')

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/app" className="brand">
          <span className="brand-mark" />
          crumb
        </NavLink>

        <div className="sidebar__group">
          <div className="sidebar__label">Workspace</div>
          {workspace.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar__hr" />

        <div className="sidebar__pitch">
          <div className="eyebrow">Make it simple</div>
          <p>Good food starts with a little inspiration.</p>
        </div>

        <button className="nav-item nav-item--danger" onClick={handleLogout}>
          <IconLogout size={17} />
          Log Out
        </button>

        <div className="sidebar__tip">
          <strong>
            <IconSpark size={15} /> A little tip
          </strong>
          <p>Plan ahead. Stress less.</p>
        </div>
      </aside>

      <div className="main">
        <div className={`page${floatingAvatar ? ' page--avatar' : ''}`}>
          {floatingAvatar && (
            <div className="page__avatar">
              <Avatar user={user} />
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export function Avatar({ user, large }) {
  return (
    <div className={`avatar${large ? ' avatar--lg' : ''}`} title={user?.name}>
      {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : initials(user?.name)}
    </div>
  )
}

export function PageHead({ title, subtitle, action }) {
  return (
    <div className="page__head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
