import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'
import Navbar from '../components/Navbar'
import ContactButtons from '../components/ContactButtons'

const statusStyles = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700'
}

// Defines which status can move to which next status
const nextActions = {
  PENDING: [{ labelKey: 'dashboard.accept', value: 'CONFIRMED', style: 'bg-primary text-white' }, { labelKey: 'dashboard.reject', value: 'CANCELLED', style: 'bg-red-50 text-red-600 border border-red-200' }],
  CONFIRMED: [{ labelKey: 'dashboard.startJob', value: 'IN_PROGRESS', style: 'bg-primary text-white' }],
  IN_PROGRESS: [{ labelKey: 'dashboard.markComplete', value: 'COMPLETED', style: 'bg-green-600 text-white' }],
}

export default function ProviderDashboard() {
  const { t, i18n } = useTranslation()
  console.log('Current language:', i18n.language, '| Translated title:', t('dashboard.title'))
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [myServices, setMyServices] = useState([])
  const [providerProfile, setProviderProfile] = useState(null)

  // Check if provider has any job currently in progress
  const hasActiveJob = bookings.some(b => b.status === 'IN_PROGRESS')

  useEffect(() => {
    fetchBookings()
    fetchMyServices()
    fetchProviderProfile()
  }, [])

  const fetchProviderProfile = async () => {
    try {
      const res = await api.get('/providers/my-profile')
      setProviderProfile(res.data)
    } catch {
      // ignore
    }
  }

  const fetchMyServices = async () => {
    try {
      const res = await api.get('/providers/my-services')
      setMyServices(res.data)
    } catch {
      // ignore
    }
  }

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/bookings/provider-bookings')
      setBookings(res.data)
    } catch {
      setError('Could not load your bookings.')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (bookingId, newStatus) => {
    setUpdatingId(bookingId)
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus })
      toast.success(t('dashboard.statusUpdated', 'Status updated successfully'))
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update booking')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredBookings = filter === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === filter)

  // Quick stats for the top of the dashboard
  const stats = {
    pending: bookings.filter(b => b.status === 'PENDING').length,
    active: bookings.filter(b => ['CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="text-center text-gray-500 mt-10">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{t('dashboard.title')}</h1>
        <p className="text-gray-500 mb-6">{t('dashboard.subtitle')}</p>

        {/* Revocation Alert */}
        {providerProfile?.verificationStatus === 'REJECTED' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-6 flex gap-4 items-start shadow-sm">
            <span className="text-2xl mt-1">🛑</span>
            <div className="flex-1">
              <h3 className="text-red-800 font-bold mb-1">{t('dashboard.revokedTitle')}</h3>
              <p className="text-red-700 text-sm mb-3">
                {t('dashboard.revokedDesc')}
              </p>
              {providerProfile.rejectionReason && (
                <div className="bg-white rounded-md p-3 text-red-800 text-sm border border-red-200">
                  <span className="font-semibold block text-red-900 mb-1">{t('dashboard.adminReason')}</span>
                  {providerProfile.rejectionReason}
                </div>
              )}
              <p className="text-xs text-red-600 mt-3">
                {t('dashboard.revokedHelp')}
              </p>
            </div>
          </div>
        )}

        {/* Show this banner when provider has no approved services */}
        {!loading && myServices.filter(s => s.status === 'APPROVED').length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
            <h3 className="font-semibold text-blue-800 mb-3">👋 {t('dashboard.welcomeSetup')}</h3>
            <div className="space-y-2 text-sm">
              <p className="text-green-600">✓ {t('dashboard.setupStep1')}</p>
              <p className="text-gray-600">○ <a href="/provider-profile" className="text-blue-600 underline">{t('dashboard.setupStep2Link')}</a> {t('dashboard.setupStep2Text')}</p>
              <p className="text-gray-600">○ <a href="/provider-profile" className="text-blue-600 underline">{t('dashboard.setupStep3Link')}</a> {t('dashboard.setupStep3Text')}</p>
              <p className="text-gray-600">○ {t('dashboard.setupStep4')}</p>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500 mt-1">{t('dashboard.pending')}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
            <p className="text-xs text-gray-500 mt-1">{t('dashboard.active')}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-gray-500 mt-1">{t('dashboard.completed')}</p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${filter === status ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
            >
              {status === 'ALL' ? t('dashboard.all') : t(`status.${status}`)}
            </button>
          ))}
        </div>

        {error && <p className="text-red-600">{error}</p>}

        {!loading && filteredBookings.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            {t('dashboard.noBookings')}
          </div>
        )}

        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">{booking.service.title}</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100 inline-flex w-fit">
                      <div className="w-10 h-10 rounded-full bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
                        {booking.customer.profilePhoto ? (
                          <img src={booking.customer.profilePhoto} alt={booking.customer.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400 text-sm">👤</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 font-semibold pr-2">{booking.customer.name}</p>
                    </div>
                    <ContactButtons
                      name={booking.customer.name}
                      phone={booking.customer.phone}
                      email={booking.customer.email}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusStyles[booking.status]}`}>
                    {t(`status.${booking.status}`)}
                  </span>
                  {/* Active job indicator */}
                  {booking.status === 'IN_PROGRESS' && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium animate-pulse">
                      🔧 {t('dashboard.activeJob')}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3">
                <p>📅 {new Date(booking.bookingDate).toLocaleDateString()}</p>
                <p>🕐 {booking.timeSlot}</p>
                <p>💰 Rs. {booking.totalAmount} ({booking.paymentMode})</p>
                {booking.isUrgent && <p className="text-red-600 font-medium">⚡ {t('bookingForm.urgent')}</p>}
              </div>

              {booking.customer.address && (
                <p className="text-sm text-gray-600 mt-3 flex items-start gap-1">
                  <span>📍</span>
                  <span>{booking.customer.address}</span>
                </p>
              )}

              {booking.notes && (
                <p className="text-sm text-gray-500 mt-2 italic">"{booking.notes}"</p>
              )}

              {/* Action buttons based on current status */}
              {nextActions[booking.status] && (
                <div className="mt-4 flex flex-col gap-2">
                  {nextActions[booking.status].map((action) => {
                    const isStartJob = action.value === 'IN_PROGRESS'
                    const isBlocked = isStartJob && hasActiveJob

                    return (
                      <div key={action.value}>
                        <button
                          onClick={() => !isBlocked && updateStatus(booking.id, action.value)}
                          disabled={updatingId === booking.id || isBlocked}
                          className={`text-sm px-4 py-1.5 rounded-md font-medium transition disabled:opacity-50 ${isBlocked
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : action.style
                            }`}
                        >
                          {updatingId === booking.id
                            ? t('dashboard.updating')
                            : t(action.labelKey)}
                        </button>

                        {/* Warning message shown only when Start Job is blocked */}
                        {isBlocked && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            ⚠️ {t('dashboard.activeWarning')}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}