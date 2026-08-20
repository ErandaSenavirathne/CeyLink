import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles, redirectTo }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) {
    const fallbackRedirect = allowedRoles && allowedRoles.includes('ADMIN') ? '/admin/login' : '/login'
    return <Navigate to={redirectTo || fallbackRedirect} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const homeRedirect =
      user.role === 'ADMIN'
        ? '/admin'
        : user.role === 'PROVIDER'
        ? '/dashboard'
        : '/browse'
    return <Navigate to={homeRedirect} replace />
  }

  return children
}