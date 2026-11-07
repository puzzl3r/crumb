import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/AppShell'
import { useAuth } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import Ingredients from './pages/Ingredients'
import Login from './pages/Login'
import MealPlanner from './pages/MealPlanner'
import MyRecipes from './pages/MyRecipes'
import RecipeDetail from './pages/RecipeDetail'
import RecipeEditor from './pages/RecipeEditor'
import Recipes from './pages/Recipes'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'
import Signup from './pages/Signup'

function Splash() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', gap: 14 }}>
      <span className="brand-mark" style={{ width: 42, height: 42 }} />
      <span className="spinner spinner--ink" />
    </div>
  )
}

function Protected({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (user) return <Navigate to="/app" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route
        path="/login"
        element={
          <GuestOnly>
            <Login />
          </GuestOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestOnly>
            <Signup />
          </GuestOnly>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/app"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="recipes" element={<Recipes />} />
        <Route path="recipes/new" element={<RecipeEditor />} />
        <Route path="recipes/:id" element={<RecipeDetail />} />
        <Route path="recipes/:id/edit" element={<RecipeEditor />} />
        <Route path="planner" element={<MealPlanner />} />
        <Route path="my-recipes" element={<MyRecipes />} />
        <Route path="ingredients" element={<Ingredients />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function NotFound() {
  return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <h1>Page not found</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        That page doesn't exist. <a href="/app">Back to your dashboard</a>
      </p>
    </div>
  )
}
