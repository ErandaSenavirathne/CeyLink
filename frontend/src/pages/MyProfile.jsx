import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Navbar from '../components/Navbar'
import sriLankaCities from '../data/sriLankaCities'
import { useTranslation } from 'react-i18next'

const districts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
]

export default function MyProfile() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    district: user?.district || '',
    city: user?.city || '',
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

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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
      if (res.data.profilePhoto) {
        setProfilePhoto(res.data.profilePhoto)
      }
    } catch (err) {
      console.error('Could not fetch user details', err)
    }
  }

  // Photo State
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [photoMessage, setPhotoMessage] = useState({ type: '', text: '' })

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleUploadPhoto = async () => {
    if (!selectedFile) return
    setUploading(true)
    setPhotoMessage({ type: '', text: '' })

    const uploadData = new FormData()
    uploadData.append('photo', selectedFile)

    try {
      const res = await api.post('/auth/profile-photo', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setProfilePhoto(res.data.profilePhoto)
      setSelectedFile(null)
      setPhotoPreview(null)
      setPhotoMessage({ type: 'success', text: 'Profile photo updated!' })
    } catch (err) {
      setPhotoMessage({ type: 'error', text: err.response?.data?.error || 'Failed to upload photo.' })
    } finally {
      setUploading(false)
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

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    if (deleteConfirmation !== 'DELETE') return
    
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await api.delete('/auth/me')
      logout()
      navigate('/')
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account')
      setDeleteLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('myProfile.title')}</h1>

        {/* Profile Photo Upload */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-accent">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{t('myProfile.profilePicture')}</h2>
          
          {photoMessage.text && (
            <div className={`p-3 rounded-md mb-4 text-sm font-medium ${photoMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {photoMessage.text}
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-4xl">📷</span>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm text-gray-600 mb-3">
                {t('myProfile.uploadHelper')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 transition cursor-pointer"
                />
                
                {selectedFile && (
                  <button
                    onClick={handleUploadPhoto}
                    disabled={uploading}
                    className="bg-accent text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-teal-600 transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {uploading ? t('myProfile.uploading') : t('myProfile.savePhoto')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Account Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{t('myProfile.accountOverview')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">{t('myProfile.emailAddress')}</p>
              <p className="font-medium text-gray-800">{user?.email}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">{t('myProfile.accountRole')}</p>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium text-xs">
                {t('myProfile.customer')}
              </span>
            </div>
            <div>
              <p className="text-gray-500 mb-1">{t('myProfile.memberSince')}</p>
              <p className="font-medium text-gray-800">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{t('myProfile.personalInformation')}</h2>

          {profileSuccess && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-sm font-medium">{profileSuccess}</div>}
          {profileError && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm font-medium">{profileError}</div>}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myProfile.fullName')}</label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myProfile.phoneNumber')}</label>
                <input
                  type="tel"
                  required
                  value={profileData.phone}
                  onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myProfile.district')}</label>
                <select
                  required
                  value={profileData.district}
                  onChange={e => setProfileData({ ...profileData, district: e.target.value, city: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm bg-white"
                >
                  <option value="">{t('myProfile.selectDistrict')}</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('myProfile.cityTown')} <span className="text-gray-400 font-normal">({t('myProfile.optional')})</span>
                </label>
                <select
                  value={profileData.city}
                  onChange={e => setProfileData({ ...profileData, city: e.target.value })}
                  disabled={!profileData.district}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm bg-white ${!profileData.district ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">{profileData.district ? `${t('myProfile.allCitiesIn')} ${profileData.district}` : t('myProfile.selectDistrictFirst')}</option>
                  {profileData.district && sriLankaCities[profileData.district]?.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('myProfile.address')}</label>
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
              {profileLoading ? t('myProfile.saving') : t('myProfile.saveChanges')}
            </button>
          </form>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{t('myProfile.security')}</h2>

          {passwordSuccess && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-sm font-medium">{passwordSuccess}</div>}
          {passwordError && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm font-medium">{passwordError}</div>}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('myProfile.currentPassword')}</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myProfile.newPassword')}</label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myProfile.confirmNewPassword')}</label>
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
              {passwordLoading ? t('myProfile.updating') : t('myProfile.changePassword')}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-xl border border-red-100 p-6 mt-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">{t('myProfile.dangerZone')}</h2>
          <p className="text-red-600 text-sm mb-4">
            {t('myProfile.deleteWarning')}
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition"
          >
            {t('myProfile.deleteAccount')}
          </button>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{t('myProfile.deleteAccountModalTitle')}</h2>
            <p className="text-gray-600 text-sm mb-4">
              {t('myProfile.deleteModalText')}
            </p>
            
            {deleteError && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm font-medium">
                {deleteError}
              </div>
            )}
            
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <input 
                type="text" 
                required
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              
              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  {t('myProfile.cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={deleteConfirmation !== 'DELETE' || deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleteLoading ? t('myProfile.deleting') : t('myProfile.permanentlyDelete')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
