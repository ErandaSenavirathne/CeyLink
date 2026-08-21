import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
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

export default function MyBookings() {
  const { t } = useTranslation()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewingId, setReviewingId] = useState(null)
  const [reviewData, setReviewData] = useState({ rating: 5, reviewText: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/bookings/my-bookings')
      setBookings(res.data)
    } catch {
      setError('Could not load your bookings.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    try {
      await api.patch(`/bookings/${bookingId}/cancel`)
      fetchBookings()
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel booking')
    }
  }

  const openReviewForm = (bookingId) => {
    setReviewingId(bookingId)
    setReviewData({ rating: 5, reviewText: '' })
  }

  const submitReview = async (e) => {
    e.preventDefault()
    setReviewSubmitting(true)
    try {
      await api.post('/reviews', {
        bookingId: reviewingId,
        rating: reviewData.rating,
        reviewText: reviewData.reviewText
      })
      setReviewingId(null)
      fetchBookings()
    } catch (err) {
      alert(err.response?.data?.error || 'Could not submit review')
    } finally {
      setReviewSubmitting(false)
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
                label="Contact Provider"
              />

              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{booking.service.title}</h3>
                  <p className="text-sm text-gray-500">with {booking.provider.user.name}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusStyles[booking.status]}`}>
                  {t(`status.${booking.status}`)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3">
                <p>📅 {new Date(booking.bookingDate).toLocaleDateString()}</p>
                <p>🕐 {booking.timeSlot}</p>
                <p>💰 Rs. {booking.totalAmount} ({booking.paymentMode})</p>
                {booking.isUrgent && <p className="text-red-600 font-medium">⚡ Urgent</p>}
              </div>

              {booking.notes && (
                <p className="text-sm text-gray-500 mt-2 italic">"{booking.notes}"</p>
              )}

              {/* Action buttons depending on status */}
              <div className="mt-4 flex gap-2">
                {booking.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition"
                  >
                    {t('myBookings.cancelBooking')}
                  </button>
                )}

                {booking.status === 'COMPLETED' && !booking.review && reviewingId !== booking.id && (
                  <button
                    onClick={() => openReviewForm(booking.id)}
                    className="text-sm text-accent border border-accent px-3 py-1.5 rounded-md hover:bg-accent/10 transition"
                  >
                    {t('myBookings.leaveReview')}
                  </button>
                )}

                {booking.status === 'COMPLETED' && booking.review && (
                  <p className="text-sm text-green-600">✓ {t('myBookings.reviewed')}</p>
                )}
              </div>

              {/* Inline review form */}
              {reviewingId === booking.id && (
                <form onSubmit={submitReview} className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewData({ ...reviewData, rating: star })}
                          className={`text-2xl ${star <= reviewData.rating ? 'text-amber-400' : 'text-gray-300'}`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      placeholder="Share your experience..."
                      value={reviewData.reviewText}
                      onChange={(e) => setReviewData({ ...reviewData, reviewText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="bg-primary text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-900 transition disabled:opacity-50"
                    >
                      {reviewSubmitting ? '...' : t('myBookings.submitReview')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewingId(null)}
                      className="text-sm text-gray-500 px-4 py-1.5"
                    >
                      {t('myBookings.cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}