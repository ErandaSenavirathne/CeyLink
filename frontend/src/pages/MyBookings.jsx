import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
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
      fetchBookings()
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel booking')
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
      alert(t('myBookings.reviewSuccess') || 'Review submitted successfully')
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
    </div>
  )
}