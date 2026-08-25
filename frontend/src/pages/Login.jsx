import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'

export default function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(t('login.success', 'Login successful! Welcome back.'))
      if (user.role === 'ADMIN') {
        navigate('/admin')
      } else if (user.role === 'PROVIDER') {
        navigate('/dashboard')
      } else {
        navigate('/browse')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <SEO title="Login | CeyLink" />
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 w-full max-w-md relative pt-12">
          <Link to="/" className="absolute top-5 left-5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition flex items-center gap-1.5">
            ← Back to Home
          </Link>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t('login.title')}</h1>
          </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-md font-semibold hover:bg-blue-900 transition disabled:opacity-50"
          >
            {loading ? t('login.loading') : t('login.submit')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="text-accent font-semibold">{t('login.signUp')}</Link>
        </p>

        </div>
      </div>
    </div>
  )
}