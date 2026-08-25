import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'
import Navbar from '../components/Navbar'

export default function BookingForm() {
  const { t } = useTranslation()
  const { serviceId } = useParams()
  const navigate = useNavigate()

  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    bookingDate: '',
    timeSlot: '',
    paymentMode: 'CASH',
    notes: '',
    isUrgent: false
  })

  // Photo upload state
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const timeSlots = [
    '8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '12:00 PM - 2:00 PM',
    '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM'
  ]

  useEffect(() => {
    fetchService()
  }, [serviceId])

  // Clean up the preview URL when the component unmounts or photo changes
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Basic client-side validation matching the backend's allowed types and size limit
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image.')
      setError('Please select a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB.')
      setError('Image must be smaller than 5MB.')
      return
    }

    setError('')
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      let photoUrls = []

      // Step 1: Upload the photo first (if one was selected) to get its Cloudinary URL
      if (photoFile) {
        setUploadingPhoto(true)

        const photoFormData = new FormData()
        photoFormData.append('photo', photoFile)

        const uploadRes = await api.post('/upload/photo', photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        photoUrls = [uploadRes.data.url]
        setUploadingPhoto(false)
      }

      // Step 2: Create the booking, including the photo URL if we got one
      await api.post('/bookings', {
        serviceId,
        ...formData,
        photoUrls
      })

      toast.success(t('bookingForm.confirmed', 'Booking confirmed successfully!'))
      setSuccess(true)
      setTimeout(() => navigate('/my-bookings'), 2000)
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Booking failed. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setSubmitting(false)
      setUploadingPhoto(false)
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
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('bookingForm.confirmed')}</h2>
          <p className="text-gray-500">{t('bookingForm.redirecting')}</p>
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
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition mb-4 font-medium"
        >
          ← Back to Provider
        </button>
        <h1 className="text-xl font-bold text-gray-800 mb-1">{t('bookingForm.title')}</h1>

        {service && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 mt-4">
            <h3 className="font-semibold text-gray-800">{service.title}</h3>
            <p className="text-sm text-gray-500">{t('bookingForm.with')} {service.providerName}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('bookingForm.date')}</label>
            <input
              type="date" name="bookingDate" required min={today}
              value={formData.bookingDate} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('bookingForm.timeSlot')}</label>
            <select
              name="timeSlot" required
              value={formData.timeSlot} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">{t('bookingForm.selectTime')}</option>
              {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('bookingForm.paymentMethod')}</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMode: 'CASH' })}
                className={`flex-1 py-2 rounded-md border-2 font-medium text-sm ${formData.paymentMode === 'CASH' ? 'border-accent bg-accent/10 text-accent' : 'border-gray-300 text-gray-500'}`}
              >
                💵 {t('bookingForm.cash')}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMode: 'ONLINE' })}
                className={`flex-1 py-2 rounded-md border-2 font-medium text-sm ${formData.paymentMode === 'ONLINE' ? 'border-accent bg-accent/10 text-accent' : 'border-gray-300 text-gray-500'}`}
              >
                💳 {t('bookingForm.online')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('bookingForm.describeIssue')}</label>
            <textarea
              name="notes" rows={3}
              value={formData.notes} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder={t('bookingForm.placeholderNotes')}
            />
          </div>

          {/* Photo upload field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('bookingForm.addPhoto')}</label>
            <p className="text-xs text-gray-400 mb-2">{t('bookingForm.photoHelper')}</p>

            {!photoPreview && (
              <div>
                <input
                  type="file"
                  id="bookingPhotoUpload"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="bookingPhotoUpload"
                  className="block w-full text-center text-sm text-gray-600 border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:bg-gray-50 transition"
                >
                  {t('bookingForm.chooseFile')}
                </label>
              </div>
            )}

            {photoPreview && (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-md border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-600"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox" name="isUrgent"
              checked={formData.isUrgent} onChange={handleChange}
              className="rounded"
            />
              {t('bookingForm.urgent')}
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white py-2.5 rounded-md font-semibold hover:bg-blue-900 transition disabled:opacity-50"
          >
            {uploadingPhoto ? t('bookingForm.uploading') : submitting ? t('bookingForm.confirming') : t('bookingForm.confirm')}
          </button>
        </form>
      </div>
    </div>
  )
}
