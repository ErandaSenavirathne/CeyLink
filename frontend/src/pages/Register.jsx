import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import sriLankaCities from '../data/sriLankaCities'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'

const districts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
]

export default function Register() {
  const { t } = useTranslation()
  const location = useLocation()
  const initialRole = location.state?.role || 'CUSTOMER'

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', role: initialRole, district: '', city: '', address: ''
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'district') {
      setFormData({ ...formData, district: value, city: '' })
    } else {
      setFormData({ ...formData, [name]: value })
    }
    // Clear the error for this field as user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  // Client-side validation
  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = t('register.errors.nameRequired')
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('register.errors.nameMin')
    }

    if (!formData.email.trim()) {
      newErrors.email = t('register.errors.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('register.errors.emailInvalid')
    }

    if (!formData.password) {
      newErrors.password = t('register.errors.passwordRequired')
    } else if (formData.password.length < 6) {
      newErrors.password = t('register.errors.passwordMin')
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = t('register.errors.passwordUpper')
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = t('register.errors.passwordNum')
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.confirmRequired')
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.passwordMismatch')
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('register.errors.phoneRequired')
    } else if (!/^(\+94|0)[0-9]{9}$/.test(formData.phone.trim())) {
      newErrors.phone = t('register.errors.phoneInvalid')
    }

    if (!formData.district) {
      newErrors.district = t('register.errors.districtRequired')
    }

    if (formData.role === 'CUSTOMER' && !formData.address.trim()) {
      newErrors.address = t('register.errors.addressRequired')
    } else if (formData.role === 'CUSTOMER' && formData.address.trim().length < 5) {
      newErrors.address = t('register.errors.addressMin')
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    // Run client-side validation first
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error(t('register.errors.fixForm', 'Please fix the errors in the form.'))
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setLoading(true)
    try {
      const { confirmPassword, ...submitData } = formData
      await register(submitData)
      toast.success(t('register.success', 'Registration successful! Welcome to CeyLink.'))
      navigate(formData.role === 'PROVIDER' ? '/dashboard' : '/browse')
    } catch (err) {
      // Handle backend validation errors
      const data = err.response?.data
      if (data?.errors && Array.isArray(data.errors)) {
        const backendErrors = {}
        data.errors.forEach(e => {
          backendErrors[e.path] = e.msg
        })
        setErrors(backendErrors)
        toast.error(t('register.errors.fixForm', 'Please fix the errors in the form.'))
      } else {
        const errorMsg = data?.error || 'Registration failed. Please try again.'
        setServerError(errorMsg)
        toast.error(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  // Helper to show field error
  const FieldError = ({ field }) => errors[field] ? (
    <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
  ) : null

  // Helper for input class — red border if error
  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t('register.title')}</h1>
          </div>

        {serverError && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('register.iAmA')}</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'CUSTOMER' })}
                className={`flex-1 py-2 rounded-md border-2 font-medium ${formData.role === 'CUSTOMER'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-gray-300 text-gray-500'
                  }`}
              >
                {t('register.customer')}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'PROVIDER' })}
                className={`flex-1 py-2 rounded-md border-2 font-medium ${formData.role === 'PROVIDER'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-gray-300 text-gray-500'
                  }`}
              >
                {t('register.provider')}
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('register.fullName')} <span className="text-red-500">*</span>
            </label>
            <input
              name="name" type="text"
              value={formData.name} onChange={handleChange}
              className={inputClass('name')}
              placeholder={t('register.namePlaceholder')}
            />
            <FieldError field="name" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('register.email')} <span className="text-red-500">*</span>
            </label>
            <input
              name="email" type="email"
              value={formData.email} onChange={handleChange}
              className={inputClass('email')}
              placeholder={t('register.emailPlaceholder')}
            />
            <FieldError field="email" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('register.password')} <span className="text-red-500">*</span>
            </label>
            <input
              name="password" type="password"
              value={formData.password} onChange={handleChange}
              className={inputClass('password')}
              placeholder={t('register.passwordPlaceholder')}
            />
            <FieldError field="password" />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('register.confirmPassword')} <span className="text-red-500">*</span>
            </label>
            <input
              name="confirmPassword" type="password"
              value={formData.confirmPassword} onChange={handleChange}
              className={inputClass('confirmPassword')}
              placeholder={t('register.confirmPlaceholder')}
            />
            <FieldError field="confirmPassword" />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('register.phone')} <span className="text-red-500">*</span>
            </label>
            <input
              name="phone" type="tel"
              value={formData.phone} onChange={handleChange}
              className={inputClass('phone')}
              placeholder={t('register.phonePlaceholder')}
            />
            <FieldError field="phone" />
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('register.district')} <span className="text-red-500">*</span>
            </label>
            <select
              name="district"
              value={formData.district} onChange={handleChange}
              className={inputClass('district')}
            >
              <option value="">{t('register.selectDistrict')}</option>
              {districts.map(d => (
                <option key={d} value={d}>{t(`districts.${d}`, d)}</option>
              ))}
            </select>
            <FieldError field="district" />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('register.city')} <span className="text-gray-400 font-normal">{t('register.optional')}</span>
            </label>
            <select
              name="city"
              value={formData.city} onChange={handleChange}
              disabled={!formData.district}
              className={`${inputClass('city')} ${!formData.district ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">{formData.district ? `${t('register.allCitiesIn')} ${t(`districts.${formData.district}`, formData.district)}` : t('register.selectDistrictFirst')}</option>
              {formData.district && sriLankaCities[formData.district]?.map(c => (
                <option key={c} value={c}>{t(`cities.${c.replace(/[^a-zA-Z0-9]/g, '')}`, c)}</option>
              ))}
            </select>
          </div>

          {/* Address — customers only */}
          {formData.role === 'CUSTOMER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('register.address')} <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address" rows={2}
                value={formData.address} onChange={handleChange}
                className={inputClass('address')}
                placeholder={t('register.addressPlaceholder')}
              />
              <FieldError field="address" />
            </div>
          )}

          {/* Password requirements hint */}
          <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-500">
            <p className="font-medium mb-1">{t('register.passwordReqs.title')}</p>
            <p className={formData.password.length >= 6 ? 'text-green-600' : ''}>
              {formData.password.length >= 6 ? '✓' : '○'} {t('register.passwordReqs.length')}
            </p>
            <p className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
              {/[A-Z]/.test(formData.password) ? '✓' : '○'} {t('register.passwordReqs.upper')}
            </p>
            <p className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
              {/[0-9]/.test(formData.password) ? '✓' : '○'} {t('register.passwordReqs.number')}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-md font-semibold hover:bg-blue-900 transition disabled:opacity-50"
          >
            {loading ? t('register.loading') : t('register.submit')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('register.haveAccount')} {' '}
          <Link to="/login" className="text-accent font-semibold">{t('register.login')}</Link>
        </p>
        </div>
      </div>
    </div>
  )
}