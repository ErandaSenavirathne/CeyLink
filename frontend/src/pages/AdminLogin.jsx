import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, logout } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role !== 'ADMIN') {
        logout()
        const errorMsg = 'Access denied: Admin privileges required.'
        setError(errorMsg)
        toast.error(errorMsg)
      } else {
        toast.success('Admin login successful')
        navigate('/admin')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed. Please check your credentials.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <SEO title="Admin Login | CeyLink" />
      <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            <Link to="/" className="hover:opacity-80 transition cursor-pointer">
              CeyLink <span className="text-amber-500">Admin</span> 🇱🇰
            </Link>
          </h1>
          <p className="text-slate-400 text-sm">Sign in to control panel</p>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-750 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="admin@ceylink.lk"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-750 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 py-3 rounded-lg font-bold transition duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Authenticating...' : 'Access Control Panel'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-700 text-center">
          <Link to="/login" className="text-xs text-slate-400 hover:text-white font-semibold transition">
            Looking for user login? User Login
          </Link>
        </div>
      </div>
    </div>
  )
}
