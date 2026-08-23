import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import ContactButtons from '../components/ContactButtons'
import { useAuth } from '../context/AuthContext'

// Star display component
function Stars({ rating, size = 'sm' }) {
  if (!rating) return null
  const filled = Math.round(rating)
  const textSize = size === 'sm' ? 'text-sm' : 'text-base'
  return (
    <span className={`text-amber-400 ${textSize}`}>
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </span>
  )
}

// Avatar / profile photo component
function ProfilePhoto({ photo, name, size = 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-28 h-28 text-3xl' : 'w-16 h-16 text-xl'
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border-4 border-white shadow-lg`}
      />
    )
  }
  return (
    <div className={`${sizeClass} rounded-full bg-primary flex items-center justify-center text-white font-bold border-4 border-white shadow-lg`}>
      {initials}
    </div>
  )
}

export default function ProviderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('services')

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
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <div className="flex gap-6">
              <div className="w-28 h-28 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-gray-600 font-medium">{error || 'Provider not found'}</p>
          <Link to="/browse" className="text-accent mt-3 inline-block hover:underline">
            Back to Browse
          </Link>
        </div>
      </div>
    )
  }

  const memberSince = new Date(provider.user.createdAt).toLocaleDateString('en-LK', {
    year: 'numeric', month: 'long'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Back button */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition"
        >
          ← Back to results
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">

        {/* ── HERO CARD ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">

          {/* Coloured header banner */}
          <div className="h-24 bg-gradient-to-r from-primary to-blue-500" />

          <div className="px-6 pb-6">
            {/* Photo overlapping the banner */}
            <div className="flex justify-between items-end -mt-14 mb-4">
              <ProfilePhoto
                photo={provider.profilePhoto}
                name={provider.user.name}
                size="lg"
              />
              {/* Availability badge */}
              {provider.isBusy ? (
                <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full font-medium">
                  🔧 Currently Busy
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-medium">
                  🟢 Available
                </span>
              )}
            </div>

            {/* Name and badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-800">
                {provider.user.name}
              </h1>
              {provider.nicVerified && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  ✓ NIC Verified
                </span>
              )}
            </div>

            <p className="text-gray-500 text-sm mb-3">
              📍 {provider.district} District
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mb-4">
              {provider.avgRating && (
                <div className="flex items-center gap-1">
                  <Stars rating={provider.avgRating} />
                  <span className="font-semibold text-gray-700 text-sm">
                    {provider.avgRating}
                  </span>
                  <span className="text-gray-400 text-sm">
                    ({provider.reviewCount} reviews)
                  </span>
                </div>
              )}

              {provider.completedJobs > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <span>✅</span>
                  <span>{provider.completedJobs} jobs completed</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span>📅</span>
                <span>Member since {memberSince}</span>
              </div>
            </div>

            {/* Hourly rate */}
            {provider.hourlyRate && (
              <p className="text-primary font-bold text-lg mb-4">
                From Rs. {provider.hourlyRate.toLocaleString()}/hr
              </p>
            )}

            {/* Contact buttons — only for customers */}
            {user?.role === 'CUSTOMER' && (
              <ContactButtons
                name={provider.user.name}
                phone={provider.user.phone}
                label="Contact Provider"
              />
            )}
          </div>
        </div>

        {/* ── TWO COLUMN LAYOUT ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* LEFT SIDEBAR */}
          <div className="md:col-span-1 space-y-4">

            {/* About */}
            {provider.bio && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h2 className="font-semibold text-gray-800 mb-2">About</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {provider.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            {provider.skills && provider.skills.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h2 className="font-semibold text-gray-800 mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium"
                    >
                      🔧 {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick stats card */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Quick Info</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">District</span>
                  <span className="text-gray-700 font-medium">{provider.district}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Services</span>
                  <span className="text-gray-700 font-medium">{provider.services.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reviews</span>
                  <span className="text-gray-700 font-medium">{provider.reviewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Jobs Done</span>
                  <span className="text-gray-700 font-medium">{provider.completedJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Verified</span>
                  <span className={provider.nicVerified ? 'text-green-600 font-medium' : 'text-gray-400'}>
                    {provider.nicVerified ? '✓ Yes' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="md:col-span-2">

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4 bg-white rounded-t-xl shadow-sm px-4">
              {['services', 'reviews'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium capitalize transition border-b-2 -mb-px ${activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab === 'services' ? `Services (${provider.services.length})` : `Reviews (${provider.reviewCount})`}
                </button>
              ))}
            </div>

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-3">
                {provider.services.length === 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
                    No services listed yet.
                  </div>
                )}

                {provider.services.map(service => (
                  <div
                    key={service.id}
                    className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            {service.category}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {service.title}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-gray-500 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 text-right flex-shrink-0">
                        <p className="text-primary font-bold text-lg mb-2">
                          Rs. {service.basePrice.toLocaleString()}
                        </p>

                        {user?.role === 'CUSTOMER' ? (
                          <button
                            onClick={() => navigate(`/book/${service.id}`)}
                            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-600 transition whitespace-nowrap"
                          >
                            Book Now
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {user?.role === 'PROVIDER' ? 'Providers cannot book' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-3">
                {provider.reviews.length === 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <p className="text-4xl mb-2">💬</p>
                    <p className="text-gray-500">No reviews yet.</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Be the first to book and leave a review!
                    </p>
                  </div>
                )}

                {/* Rating summary */}
                {provider.reviews.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-gray-800">
                        {provider.avgRating}
                      </p>
                      <Stars rating={provider.avgRating} size="base" />
                      <p className="text-xs text-gray-400 mt-1">
                        {provider.reviewCount} reviews
                      </p>
                    </div>
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = provider.reviews.filter(r => r.rating === star).length
                        const pct = provider.reviews.length > 0
                          ? (count / provider.reviews.length) * 100
                          : 0
                        return (
                          <div key={star} className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 w-4">{star}</span>
                            <span className="text-amber-400 text-xs">★</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-amber-400 h-1.5 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-4">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Individual reviews */}
                {provider.reviews.map(review => (
                  <div key={review.id} className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {review.customer.name}
                        </p>
                        <Stars rating={review.rating} />
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('en-LK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {review.reviewText && (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        "{review.reviewText}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}