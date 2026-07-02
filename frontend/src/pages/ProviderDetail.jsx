import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

export default function ProviderDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchProvider()
  }, [id])

  const fetchProvider = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/providers/${id}`)
      setProvider(res.data)
    } catch {
      setError('Could not load provider details.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="text-center text-gray-500 mt-10">Loading provider...</p>
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="text-center text-red-600 mt-10">{error || 'Provider not found'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{provider.user.name}</h1>
              <p className="text-gray-500">{provider.district} District</p>
            </div>
            {provider.nicVerified && (
              <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                ✓ NIC Verified
              </span>
            )}
          </div>

          {provider.bio && <p className="text-gray-600 mt-4">{provider.bio}</p>}

          {provider.hourlyRate && (
            <p className="text-primary font-semibold mt-3">
              Rs. {provider.hourlyRate}/hour
            </p>
          )}
        </div>

        {/* Services */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Services Offered</h2>

          {provider.services.length === 0 && (
            <p className="text-gray-500 text-sm">No services listed yet.</p>
          )}

          <div className="space-y-3">
            {provider.services.map((service) => (
              <div key={service.id} className="border border-gray-200 rounded-md p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800">{service.title}</h3>
                  <p className="text-sm text-gray-500">{service.category}</p>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary mb-2">Rs. {service.basePrice}</p>
                  {user?.role === 'CUSTOMER' && (
                    <button
                      onClick={() => navigate(`/book/${service.id}`)}
                      className="bg-accent text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-teal-600 transition"
                    >
                      {t('browse.viewProfile')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Reviews {provider.reviews.length > 0 && `(${provider.reviews.length})`}
          </h2>

          {provider.reviews.length === 0 && (
            <p className="text-gray-500 text-sm">No reviews yet.</p>
          )}

          <div className="space-y-4">
            {provider.reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-800 text-sm">{review.customer.name}</span>
                  <span className="text-amber-500 text-sm">{'⭐'.repeat(review.rating)}</span>
                </div>
                {review.reviewText && (
                  <p className="text-sm text-gray-600">{review.reviewText}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}