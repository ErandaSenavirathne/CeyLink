import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'
import api from '../services/api'
import Navbar from '../components/Navbar'
import ContactButtons from '../components/ContactButtons'
import StarRatingInput from '../components/StarRatingInput'

const statusStyles = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700'
}

export default function MyBookings() {
  const { t } = useTranslation()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewData, setReviewData] = useState({}) // { bookingId: { rating, text, submitting, error } }
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/bookings/my-bookings')
      setBookings(res.data)

      const newReviewData = {}
      res.data
        .filter(b => b.status === 'COMPLETED' && !b.review)
        .forEach(b => {
          newReviewData[b.id] = { rating: 0, text: '', submitting: false, error: '' }
        })
      setReviewData(newReviewData)
    } catch {
      setError('Could not load your bookings.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (bookingId) => {
    if (!confirm(t('myBookings.confirmCancel') || 'Are you sure you want to cancel this booking?')) return
    try {
      await api.patch(`/bookings/${bookingId}/cancel`)
      toast.success(t('myBookings.cancelSuccess', 'Booking cancelled successfully'))
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not cancel booking')
    }
  }

  const submitReview = async (bookingId) => {
    const data = reviewData[bookingId]
    if (!data || data.rating === 0) return

    setReviewData(prev => ({ ...prev, [bookingId]: { ...prev[bookingId], submitting: true, error: '' } }))

    try {
      await api.post('/reviews', {
        bookingId,
        rating: data.rating,
        reviewText: data.text
      })
      fetchBookings()
      toast.success(t('myBookings.reviewSuccess') || 'Review submitted successfully')
    } catch (err) {
      setReviewData(prev => ({
        ...prev,
        [bookingId]: {
          ...prev[bookingId],
          submitting: false,
          error: err.response?.data?.error || 'Could not submit review'
        }
      }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="text-center text-gray-500 mt-10">Loading your bookings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title="My Bookings | CeyLink" />
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{t('myBookings.title')}</h1>
        <p className="text-gray-500 mb-6">{t('myBookings.subtitle')}</p>



        {error && <p className="text-red-600">{error}</p>}

        {!loading && bookings.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            {t('myBookings.noBookings')}
          </div>
        )}

        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-sm p-5">

              <ContactButtons
                name={booking.provider.user.name}
                phone={booking.provider.user.phone}
                label={t('myBookings.contactProvider')}
              />

              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-700">{booking.bookingRef}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{booking.service.title}</h3>
                  <p className="text-sm text-gray-500">{t('bookingForm.with')} {booking.provider.user.name}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusStyles[booking.status]}`}>
                  {t(`status.${booking.status}`)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3">
                <p>📅 {new Date(booking.bookingDate).toLocaleDateString()}</p>
                <p>🕐 {booking.timeSlot}</p>
                <p>💰 Rs. {booking.totalAmount} ({booking.paymentMode})</p>
                {booking.isUrgent && <p className="text-red-600 font-medium">⚡ {t('bookingForm.urgent')}</p>}
              </div>

              {booking.notes && (
                <p className="text-sm text-gray-500 mt-2 italic">"{booking.notes}"</p>
              )}

              {/* Photo Attachments */}
              {booking.photoUrls && booking.photoUrls.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
                    📷 Attachments
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {booking.photoUrls.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPhotoUrl(url)}
                        className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-200 hover:ring-2 hover:ring-primary transition group"
                      >
                        <img 
                          src={url} 
                          alt={`Attachment ${idx + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <span className="text-white text-xs">🔍</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons depending on status */}
              <div className="mt-4 flex flex-col gap-2">
                {booking.status === 'PENDING' && (
                  <div>
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition"
                    >
                      {t('myBookings.cancelBooking')}
                    </button>
                  </div>
                )}

                {booking.status === 'COMPLETED' && booking.review && (
                  <p className="text-sm text-green-600 font-medium">✓ {t('myBookings.reviewed')}</p>
                )}

                {booking.status === 'COMPLETED' && !booking.review && reviewData[booking.id] && (
                  <div className="mt-2 bg-amber-50 border border-amber-100 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-gray-800 mb-3">⭐ {t('myBookings.rateExp')}</p>
                    <div className="space-y-3">
                      <StarRatingInput
                        value={reviewData[booking.id].rating}
                        onChange={(rating) => setReviewData(prev => ({ ...prev, [booking.id]: { ...prev[booking.id], rating } }))}
                        size="md"
                      />
                      <textarea
                        rows="2"
                        placeholder={t('myBookings.shareExp')}
                        value={reviewData[booking.id].text}
                        onChange={(e) => setReviewData(prev => ({ ...prev, [booking.id]: { ...prev[booking.id], text: e.target.value } }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm bg-white"
                      />
                      {reviewData[booking.id].error && <p className="text-red-600 text-xs">{reviewData[booking.id].error}</p>}
                      <button
                        onClick={() => submitReview(booking.id)}
                        disabled={reviewData[booking.id].rating === 0 || reviewData[booking.id].submitting}
                        className="bg-accent text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-teal-600 transition disabled:opacity-50"
                      >
                        {reviewData[booking.id].submitting ? t('myBookings.submitting') : t('myBookings.submitReview')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhotoUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedPhotoUrl(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedPhotoUrl(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black/50 hover:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center text-xl transition"
            >
              ✕
            </button>
            <img 
              src={selectedPhotoUrl} 
              alt="Full size attachment" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}