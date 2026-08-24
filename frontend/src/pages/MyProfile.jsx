import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Navbar from '../components/Navbar'

const districts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
]

export default function MyProfile() {
  const { user } = useAuth()

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    district: user?.district || '',
    address: user?.address || ''
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    // Fetch latest user data to ensure profile form is populated if not fully in context
    fetchMe()
  }, [])

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me')
      setProfileData({
        name: res.data.name || '',
        phone: res.data.phone || '',
        district: res.data.district || '',
        address: res.data.address || ''
      })
    } catch (err) {
      console.error('Could not fetch user details', err)
    }
  }



  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')
    try {
      await api.put('/auth/profile', profileData)
      setProfileSuccess('Personal information updated successfully.')
    } catch (err) {
      if (err.response?.data?.errors) {
        setProfileError(err.response.data.errors.map(e => e.msg).join(', '))
      } else {
        setProfileError(err.response?.data?.error || 'Failed to update profile')
      }
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPasswordError('New passwords do not match')
    }

    setPasswordLoading(true)
    try {
      await api.put('/auth/password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordSuccess('Password changed successfully.')
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      if (err.response?.data?.errors) {
        setPasswordError(err.response.data.errors.map(e => e.msg).join(', '))
      } else {
        setPasswordError(err.response?.data?.error || 'Failed to change password')
      }
    } finally {
      setPasswordLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>


        {/* Account Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Account Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Email Address</p>
              <p className="font-medium text-gray-800">{user?.email}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Account Role</p>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium text-xs">
                Customer
              </span>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Member Since</p>
              <p className="font-medium text-gray-800">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h2>

          {profileSuccess && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-sm font-medium">{profileSuccess}</div>}
          {profileError && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm font-medium">{profileError}</div>}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={profileData.phone}
                  onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <select
                required
                value={profileData.district}
                onChange={e => setProfileData({ ...profileData, district: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm bg-white"
              >
                <option value="">Select District</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                required
                rows="2"
                value={profileData.address}
                onChange={e => setProfileData({ ...profileData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="bg-primary text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-blue-900 transition disabled:opacity-50"
            >
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Security</h2>

          {passwordSuccess && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-sm font-medium">{passwordSuccess}</div>}
          {passwordError && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm font-medium">{passwordError}</div>}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.oldPassword}
                onChange={e => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-accent text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-teal-600 transition disabled:opacity-50"
            >
              {passwordLoading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
