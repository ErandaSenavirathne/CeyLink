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
      <Link to={user ? "/browse" : "/"} className="text-xl font-bold">CeyLink 🇱🇰</Link>

      <div className="flex items-center gap-4">
        {user?.role === 'CUSTOMER' && (
          <>
            <Link to="/browse" className="hover:text-accent transition">{t('nav.browse')}</Link>
            <Link to="/my-bookings" className="hover:text-accent transition">{t('nav.myBookings')}</Link>
            <Link to="/my-profile" className="hover:text-accent transition">{t('nav.myProfile')}</Link>
          </>
        )}
        {user?.role === 'PROVIDER' && (
          <>
            <Link to="/dashboard" className="hover:text-accent transition">{t('nav.dashboard')}</Link>
            <Link to="/provider-profile" className="hover:text-accent transition">{t('nav.myProfile')}</Link>
          </>
        )}
        {user?.role === 'ADMIN' && (
          <Link to="/admin" className="hover:text-accent transition">{t('nav.adminPanel')}</Link>
        )}

        {/* Language switcher */}
        {user?.role !== 'ADMIN' && (
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
        )}

        {user && (
          <>
            <div className="flex items-center gap-2">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-sm">👤</span>
                </div>
              )}
              <span className="text-sm text-gray-200">{t('nav.greeting')}, {user.name}</span>
            </div>

            <button
              onClick={handleLogout}
              className="bg-accent text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-teal-600 transition"
            >
              {t('nav.logout')}
            </button>
          </>
        )}
      </div>
    </nav>
  )
}