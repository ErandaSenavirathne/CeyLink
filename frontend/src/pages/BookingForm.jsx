import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

export default function BookingForm() {
  const { serviceId } = useParams()
  const navigate = useNavigate()

  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    bookingDate: '',
    timeSlot: '',
    paymentMode: 'CASH',
    notes: '',
    isUrgent: false
  })

  const timeSlots = [
    '8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '12:00 PM - 2:00 PM',
    '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM'
  ]

  useEffect(() => {
    fetchService()
  }, [serviceId])

  const fetchService = async () => {
    try {
      // We get the service through the provider list since there's no single-service endpoint yet
      const res = await api.get('/providers')
      const allServices = res.data.flatMap(p => p.services.map(s => ({ ...s, providerName: p.user.name })))
      const found = allServices.find(s => s.id === serviceId)
      setService(found)
    } catch {
      setError('Could not load service details.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await api.post('/bookings', {
        serviceId,
        ...formData
      })
      setSuccess(true)
      setTimeout(() => navigate('/my-bookings'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="text-center text-gray-500 mt-10">Loading...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto mt-20 bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500">Redirecting to your bookings...</p>
        </div>
      </div>
    )
  }

  // Get today's date in YYYY-MM-DD format for the min date attribute
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Confirm Your Booking</h1>

        {service && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 mt-4">
            <h3 className="font-semibold text-gray-800">{service.title}</h3>
            <p className="text-sm text-gray-500">with {service.providerName}</p>
            <p className="text-primary font-semibold mt-1">Rs. {service.basePrice}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date" name="bookingDate" required min={today}
              value={formData.bookingDate} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
            <select
              name="timeSlot" required
              value={formData.timeSlot} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select a time</option>
              {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMode: 'CASH' })}
                className={`flex-1 py-2 rounded-md border-2 font-medium text-sm ${formData.paymentMode === 'CASH' ? 'border-accent bg-accent/10 text-accent' : 'border-gray-300 text-gray-500'}`}
              >
                💵 Cash on Completion
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMode: 'ONLINE' })}
                className={`flex-1 py-2 rounded-md border-2 font-medium text-sm ${formData.paymentMode === 'ONLINE' ? 'border-accent bg-accent/10 text-accent' : 'border-gray-300 text-gray-500'}`}
              >
                💳 Pay Online
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Describe the issue (optional)</label>
            <textarea
              name="notes" rows={3}
              value={formData.notes} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="E.g. Kitchen sink is leaking..."
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox" name="isUrgent"
              checked={formData.isUrgent} onChange={handleChange}
              className="rounded"
            />
            This is an urgent request
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white py-2.5 rounded-md font-semibold hover:bg-blue-900 transition disabled:opacity-50"
          >
            {submitting ? 'Confirming...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}