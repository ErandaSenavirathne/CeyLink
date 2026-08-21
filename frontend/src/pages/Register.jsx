import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', role: 'CUSTOMER', district: '', address: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const districts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Monaragala', 'Ratnapura', 'Kegalle'
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(formData)
      navigate('/browse')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-primary mb-2">CeyLink 🇱🇰</h1>
        <p className="text-gray-500 mb-6">{t('register.title')}</p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.iAmA')}</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'CUSTOMER' })}
                className={`flex-1 py-2 rounded-md border-2 font-medium ${formData.role === 'CUSTOMER' ? 'border-accent bg-accent/10 text-accent' : 'border-gray-300 text-gray-500'}`}
              >
                {t('register.customer')}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'PROVIDER' })}
                className={`flex-1 py-2 rounded-md border-2 font-medium ${formData.role === 'PROVIDER' ? 'border-accent bg-accent/10 text-accent' : 'border-gray-300 text-gray-500'}`}
              >
                {t('register.provider')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.fullName')}</label>
            <input
              name="name" type="text" required
              value={formData.name} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.email')}</label>
            <input
              name="email" type="email" required
              value={formData.email} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.password')}</label>
            <input
              name="password" type="password" required minLength={6}
              value={formData.password} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.phone')}</label>
            <input
              name="phone" type="tel"
              value={formData.phone} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="07X XXX XXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.district')}</label>
            <select
              name="district" required
              value={formData.district} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">{t('register.selectDistrict')}</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.address')}</label>
            <input
              name="address" type="text"
              value={formData.address} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder={t('register.address')}
            />
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-md font-semibold hover:bg-blue-900 transition disabled:opacity-50"
          >
            {loading ? t('register.loading') : t('register.submit')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="text-accent font-semibold">{t('register.login')}</Link>
        </p>
      </div>
    </div>
  )
}