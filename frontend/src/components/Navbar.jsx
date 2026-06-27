import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-primary text-white px-6 py-4 flex justify-between items-center shadow-md">
      <Link to="/browse" className="text-xl font-bold">CeyLink 🇱🇰</Link>

      <div className="flex items-center gap-4">
        {user?.role === 'CUSTOMER' && (
          <Link to="/browse" className="hover:text-accent transition">Browse</Link>
        )}
        {user?.role === 'PROVIDER' && (
          <Link to="/dashboard" className="hover:text-accent transition">Dashboard</Link>
        )}
        <Link to="/my-bookings" className="hover:text-accent transition">My Bookings</Link>

        <span className="text-sm text-gray-300">Hi, {user?.name}</span>

        <button
          onClick={handleLogout}
          className="bg-accent text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-teal-600 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}