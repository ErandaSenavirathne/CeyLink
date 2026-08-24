import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import sriLankaCities from '../data/sriLankaCities'

const districts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
]

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', role: 'CUSTOMER', district: '', city: '', address: ''
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
      newErrors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter'
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^(\+94|0)[0-9]{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid Sri Lankan number (e.g. 0771234567)'
    }

    if (!formData.district) {
      newErrors.district = 'Please select your district'
    }

    if (formData.role === 'CUSTOMER' && !formData.address.trim()) {
      newErrors.address = 'Address is required'
    } else if (formData.role === 'CUSTOMER' && formData.address.trim().length < 5) {
      newErrors.address = 'Please enter a complete address'
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
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setLoading(true)
    try {
      const { confirmPassword, ...submitData } = formData
      await register(submitData)
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
      } else {
        setServerError(data?.error || 'Registration failed. Please try again.')
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-primary mb-2">CeyLink 🇱🇰</h1>
        <p className="text-gray-500 mb-6">Create your account</p>

        {serverError && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'CUSTOMER' })}
                className={`flex-1 py-2 rounded-md border-2 font-medium ${formData.role === 'CUSTOMER'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-gray-300 text-gray-500'
                  }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'PROVIDER' })}
                className={`flex-1 py-2 rounded-md border-2 font-medium ${formData.role === 'PROVIDER'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-gray-300 text-gray-500'
                  }`}
              >
                Service Provider
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name" type="text"
              value={formData.name} onChange={handleChange}
              className={inputClass('name')}
              placeholder="Kasun Perera"
            />
            <FieldError field="name" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              name="email" type="email"
              value={formData.email} onChange={handleChange}
              className={inputClass('email')}
              placeholder="kasun@example.com"
            />
            <FieldError field="email" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              name="password" type="password"
              value={formData.password} onChange={handleChange}
              className={inputClass('password')}
              placeholder="Min 6 chars, 1 uppercase, 1 number"
            />
            <FieldError field="password" />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              name="confirmPassword" type="password"
              value={formData.confirmPassword} onChange={handleChange}
              className={inputClass('confirmPassword')}
              placeholder="Repeat your password"
            />
            <FieldError field="confirmPassword" />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              name="phone" type="tel"
              value={formData.phone} onChange={handleChange}
              className={inputClass('phone')}
              placeholder="0771234567"
            />
            <FieldError field="phone" />
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              District <span className="text-red-500">*</span>
            </label>
            <select
              name="district"
              value={formData.district} onChange={handleChange}
              className={inputClass('district')}
            >
              <option value="">Select your district</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <FieldError field="district" />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City/Town <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <select
              name="city"
              value={formData.city} onChange={handleChange}
              disabled={!formData.district}
              className={`${inputClass('city')} ${!formData.district ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">{formData.district ? `All cities in ${formData.district}` : 'Select a district first'}</option>
              {formData.district && sriLankaCities[formData.district]?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Address — customers only */}
          {formData.role === 'CUSTOMER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address" rows={2}
                value={formData.address} onChange={handleChange}
                className={inputClass('address')}
                placeholder="No. 42, Galle Road, Colombo 03"
              />
              <FieldError field="address" />
            </div>
          )}

          {/* Password requirements hint */}
          <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-500">
            <p className="font-medium mb-1">Password must have:</p>
            <p className={formData.password.length >= 6 ? 'text-green-600' : ''}>
              {formData.password.length >= 6 ? '✓' : '○'} At least 6 characters
            </p>
            <p className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
              {/[A-Z]/.test(formData.password) ? '✓' : '○'} At least one uppercase letter
            </p>
            <p className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
              {/[0-9]/.test(formData.password) ? '✓' : '○'} At least one number
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-md font-semibold hover:bg-blue-900 transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-semibold">Login</Link>
        </p>
      </div>
    </div>
  )
}