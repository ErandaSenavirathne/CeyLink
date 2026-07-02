import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const districts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
]

export default function Browse() {
  const { t } = useTranslation()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchProviders()
  }, [districtFilter])

  const fetchProviders = async () => {
    setLoading(true)
    setError('')
    try {
      const params = districtFilter ? { district: districtFilter } : {}
      const res = await api.get('/providers', { params })
      setProviders(res.data)
    } catch {
      setError('Could not load providers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{t('browse.title')}</h1>
        <p className="text-gray-500 mb-6">{t('browse.subtitle')}</p>

        <div className="mb-6">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">{t('browse.allDistricts')}</option>
            {districts.map(d => <option key={d} value={d}>{t(`districts.${d}`)}</option>)}
          </select>
        </div>

        {loading && <p className="text-gray-500">{t('browse.loading')}</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && providers.length === 0 && (
           <div className="bg-white rounded-lg p-8 text-center text-gray-500">
             {t('browse.noResults')}{districtFilter ? ` in ${districtFilter}` : ''} {t('browse.yet')}.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((provider) => (
            <div key={provider.id} className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{provider.user.name}</h3>
                {provider.nicVerified && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                    ✓ {t('browse.verified')}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 mb-2">{provider.district}</p>

              {provider.avgRating && (
                <p className="text-sm text-amber-600 mb-2">
                  ⭐ {provider.avgRating} ({provider.reviewCount} {t('browse.reviews')})
                </p>
              )}

              <div className="flex flex-wrap gap-1 mb-3">
                {provider.services.slice(0, 3).map((service) => (
                  <span key={service.id} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    {service.category}
                  </span>
                ))}
              </div>
              {user?.role === 'CUSTOMER' && (
                  <Link
                    to={`/provider/${provider.id}`}
                    className="block text-center bg-primary text-white py-2 rounded-md text-sm font-semibold hover:bg-blue-900 transition"
                  >
                    {t('browse.viewProfile')}
                  </Link>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}