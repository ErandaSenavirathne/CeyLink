import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'si', label: 'සිං' },
    { code: 'ta', label: 'தமி' }
  ]

  return (
    <nav className="bg-primary text-white px-6 py-4 flex justify-between items-center shadow-md">
      <Link to="/browse" className="text-xl font-bold">CeyLink 🇱🇰</Link>

      <div className="flex items-center gap-4">
        {user?.role === 'CUSTOMER' && (
          <Link to="/browse" className="hover:text-accent transition">{t('nav.browse')}</Link>
        )}
        {user?.role === 'CUSTOMER' && (
          <Link to="/my-bookings" className="hover:text-accent transition">{t('nav.myBookings')}</Link>
        )}
        {user?.role === 'PROVIDER' && (
          <Link to="/dashboard" className="hover:text-accent transition">{t('nav.dashboard')}</Link>
        )}
        {user?.role === 'ADMIN' && (
          <Link to="/admin" className="hover:text-accent transition">Admin Panel</Link>
        )}

        {/* Language switcher */}
        <div className="flex gap-1 bg-white/10 rounded-md p-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`text-xs px-2 py-1 rounded ${i18n.language === lang.code ? 'bg-accent text-white' : 'text-gray-300'}`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <span className="text-sm text-gray-300">{t('nav.greeting')}, {user?.name}</span>

        <button
          onClick={handleLogout}
          className="bg-accent text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-teal-600 transition"
        >
          {t('nav.logout')}
        </button>
      </div>
    </nav>
  )
}