import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import sriLankaCities from '../data/sriLankaCities'

const districts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
]

const categories = [
  'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning',
  'Tutoring', 'Beauty', 'Gardening', 'AC Repair', 'Other'
]

// Star rating display component
function StarRating({ rating, count }) {
  if (!rating) return (
    <p className="text-xs text-gray-400">No reviews yet</p>
  )
  return (
    <div className="flex items-center gap-1">
      <span className="text-amber-400 text-sm">{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}</span>
      <span className="text-sm font-semibold text-gray-700">{rating}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  )
}

// Avatar placeholder when no profile photo
function Avatar({ name, photo, size = 'md' }) {
  const sizes = {
    md: 'w-16 h-16 text-xl',
    lg: 'w-20 h-20 text-2xl'
  }
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover border-2 border-gray-100 shadow-sm`}
      />
    )
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-gray-100 shadow-sm`}>
      {initials}
    </div>
  )
}

export default function Browse() {
  const { t } = useTranslation()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProviders()
  }, [districtFilter, cityFilter, categoryFilter])

  const fetchProviders = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (districtFilter) params.district = districtFilter
      if (cityFilter) params.city = cityFilter
      if (categoryFilter) params.category = categoryFilter
      const res = await api.get('/providers', { params })
      setProviders(res.data)
    } catch {
      const errorMsg = 'Could not load providers. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Client-side search filter on provider name or service title
  const filteredProviders = providers.filter(provider => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const nameMatch = provider.user.name.toLowerCase().includes(query)
    const serviceMatch = provider.services.some(s =>
      s.title.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query)
    )
    return nameMatch || serviceMatch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Browse Services | CeyLink"
        description="Search and filter through hundreds of verified service providers in your area."
      />
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          {t('browse.title')}
        </h1>
        <p className="text-gray-500 mb-6">{t('browse.subtitle')}</p>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder={t('browse.searchPlaceholder') || 'Search by name or service...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          />

          {/* District filter */}
          <select
            value={districtFilter}
            onChange={e => {
              setDistrictFilter(e.target.value)
              setCityFilter('') // reset city when district changes
            }}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          >
            <option value="">{t('browse.allDistricts')}</option>
            {districts.map(d => (
              <option key={d} value={d}>{t(`districts.${d}`)}</option>
            ))}
          </select>

          {/* City filter */}
          {districtFilter && (
            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            >
              <option value="">{t('register.allCitiesIn', 'All cities in')} {t(`districts.${districtFilter}`, districtFilter)}</option>
              {sriLankaCities[districtFilter]?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          >
            <option value="">{t('browse.allCategories')}</option>
            {categories.map(c => (
              <option key={c} value={c}>{t(`categories.${c}`, c)}</option>
            ))}
          </select>

          {/* Clear filters */}
          {(districtFilter || cityFilter || categoryFilter || searchQuery) && (
            <button
              onClick={() => {
                setDistrictFilter('')
                setCityFilter('')
                setCategoryFilter('')
                setSearchQuery('')
              }}
              className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-100 transition"
            >
              {t('browse.clearFilters', 'Clear filters')}
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-4">
            {filteredProviders.length === 0
              ? t('browse.noProvidersFound', 'No providers found')
              : `${filteredProviders.length} ${filteredProviders.length !== 1 ? t('browse.providersFound', 'providers found') : t('browse.providerFound', 'provider found')}`}
          </p>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-red-600">{error}</p>
        )}

        {!loading && filteredProviders.length === 0 && !error && (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-400 text-4xl mb-3">🔍</p>
            <p className="text-gray-600 font-medium">{t('browse.noResults', 'No verified providers found')}</p>
            <p className="text-gray-400 text-sm mt-1">
              {t('browse.tryChangingFilters', 'Try changing your filters or search query')}
            </p>
          </div>
        )}

        {/* Provider Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProviders.map(provider => (
            <div
              key={provider.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card top section */}
              <div className="p-5">
                <div className="flex gap-4">
                  {/* Profile photo or avatar */}
                  <div className="flex-shrink-0">
                    <Avatar
                      name={provider.user.name}
                      photo={provider.profilePhoto}
                    />
                  </div>

                  {/* Provider info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-semibold text-gray-800 truncate">
                          {provider.user.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          📍 {t(`districts.${provider.district}`)} {t('browse.districtLabel')}
                        </p>
                      </div>

                      {/* Badges column */}
                      <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                        {provider.nicVerified && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            ✓ {t('browse.verified')}
                          </span>
                        )}
                        {provider.isBusy ? (
                          <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            🔧 {t('browse.busy')}
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            🟢 {t('browse.available')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="mt-1">
                      <StarRating
                        rating={provider.avgRating}
                        count={provider.reviewCount}
                      />
                    </div>

                    {/* Completed jobs */}
                    {provider.completedJobs > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        ✅ {provider.completedJobs} {provider.completedJobs !== 1 ? t('browse.jobsCompleted') : t('browse.jobCompleted')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio snippet */}
                {provider.bio && (
                  <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                    {provider.bio}
                  </p>
                )}

                {/* Service category tags */}
                {provider.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {[...new Set(provider.services.map(s => s.category))]
                      .slice(0, 3)
                      .map(cat => (
                        <span
                          key={cat}
                          className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
                        >
                          {cat}
                        </span>
                      ))}
                    {provider.services.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{provider.services.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card bottom section */}
              <div className="px-5 pb-4 flex items-center justify-between border-t border-gray-50 pt-3">
                {/* Services summary */}
                <div>
                  {provider.services.length > 0 ? (
                    <p className="text-sm font-semibold text-primary">
                      {provider.services.length} {provider.services.length !== 1 ? t('browse.servicesLabel') : t('browse.serviceLabel')}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">{t('browse.servicesComingSoon')}</p>
                  )}
                </div>

                {/* CTA button */}
                <Link
                  to={`/provider/${provider.id}`}
                  className="bg-primary text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-900 transition whitespace-nowrap"
                >
                  {t('browse.viewProfile')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}