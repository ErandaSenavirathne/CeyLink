import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Navbar from '../components/Navbar'
import sriLankaCities from '../data/sriLankaCities'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

const districts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
]

const categories = [
  'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning',
  'Tutoring', 'Beauty', 'Gardening', 'AC Repair', 'Other'
]

export default function ProviderProfile() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [activeTab, setActiveTab] = useState('profile')

  const [formData, setFormData] = useState({
    bio: '',
    district: '',
    city: '',
    skills: [],
    nicNumber: ''
  })
  
  const [providerStatus, setProviderStatus] = useState({
    verificationStatus: 'PENDING',
    rejectionReason: null
  })
  
  const [nicError, setNicError] = useState(null)

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const validateNIC = (nic) => {
    if (!nic) return null // NIC is optional
    const oldFormat = /^[0-9]{9}[VvXx]$/
    const newFormat = /^[0-9]{12}$/
    if (!oldFormat.test(nic) && !newFormat.test(nic)) {
      return 'Invalid NIC. Use format 123456789V or 200012345678'
    }
    return null
  }

  const [skillInput, setSkillInput] = useState('')
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  // Services state
  const [services, setServices] = useState([])
  const [newService, setNewService] = useState({ category: '', title: '', description: '', basePrice: '' })
  const [editingServiceId, setEditingServiceId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [submittingService, setSubmittingService] = useState(false)

  useEffect(() => {
    if (user && user.role !== 'PROVIDER') {
      navigate('/')
      return
    }
    fetchProfile()
    fetchServices()
  }, [user])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/providers/my-profile')
      const provider = res.data
      setFormData({
        bio: provider.bio || '',
        district: provider.district || '',
        city: provider.city || '',
        skills: provider.skills || [],
        nicNumber: provider.nicNumber || ''
      })
      setProviderStatus({
        verificationStatus: provider.verificationStatus,
        rejectionReason: provider.rejectionReason
      })
      setProfilePhoto(provider.profilePhoto)
    } catch (err) {
      toast.error('Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const res = await api.get('/providers/my-services')
      setServices(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'district') {
      setFormData({ ...formData, district: value, city: '' })
    } else {
      setFormData({ ...formData, [name]: value })
    }
    
    if (name === 'nicNumber') {
      setNicError(null)
    }
  }

  const handleAddSkill = (e) => {
    e.preventDefault()
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      })
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skillToRemove)
    })
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()

    const error = validateNIC(formData.nicNumber)
    if (error) {
      setNicError(error)
      return
    }

    setSaving(true)
    try {
      await api.put('/providers/profile', formData)
      toast.success('Profile updated successfully!')
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.error?.includes('already registered')) {
        setNicError(err.response.data.error)
      } else {
        toast.error(err.response?.data?.error || 'Failed to update profile.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUploadPhoto = async () => {
    if (!selectedFile) return
    setUploading(true)

    const uploadData = new FormData()
    uploadData.append('photo', selectedFile)

    try {
      const res = await api.post('/providers/profile-photo', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setProfilePhoto(res.data.profilePhoto)
      setSelectedFile(null)
      setPhotoPreview(null)
      toast.success('Profile photo updated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload photo.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    if (deleteConfirmation !== 'DELETE') return
    
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await api.delete('/auth/me')
      toast.success('Account deleted successfully')
      logout()
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account')
      setDeleteLoading(false)
    }
  }

  const handleAddService = async (e) => {
    e.preventDefault()
    setSubmittingService(true)
    try {
      const res = await api.post('/providers/services', newService)
      toast.success(res.data.message || 'Service submitted for admin review')
      setNewService({ category: '', title: '', description: '', basePrice: '' })
      fetchServices()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add service')
    } finally {
      setSubmittingService(false)
    }
  }

  const handleUpdateService = async (id, e) => {
    e.preventDefault()
    setSubmittingService(true)
    try {
      const res = await api.put(`/providers/services/${id}`, editForm)
      toast.success(res.data.message || 'Service updated')
      setEditingServiceId(null)
      fetchServices()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update service')
    } finally {
      setSubmittingService(false)
    }
  }

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return
    try {
      await api.delete(`/providers/services/${id}`)
      toast.success('Service deleted successfully')
      fetchServices()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete service')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="text-center text-gray-500 mt-10">Loading profile...</p>
      </div>
    )
  }

  const approvedCount = services.filter(s => s.status === 'APPROVED').length
  const pendingCount = services.filter(s => s.status === 'PENDING').length
  const rejectedCount = services.filter(s => s.status === 'REJECTED').length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-2">{t('providerProfile.title')}</h1>
        <p className="text-gray-500 mb-8">{t('providerProfile.subtitle')}</p>

        {/* Revocation Alert */}
        {providerStatus.verificationStatus === 'REJECTED' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-6 flex gap-4 items-start shadow-sm">
            <span className="text-2xl mt-1">🛑</span>
            <div className="flex-1">
              <h3 className="text-red-800 font-bold mb-1">Your provider account has been revoked</h3>
              <p className="text-red-700 text-sm mb-3">
                An administrator has revoked your ability to accept new bookings on CeyLink. Your services are currently hidden from customers.
              </p>
              {providerStatus.rejectionReason && (
                <div className="bg-white rounded-md p-3 text-red-800 text-sm border border-red-200">
                  <span className="font-semibold block text-red-900 mb-1">Reason provided by admin:</span>
                  {providerStatus.rejectionReason}
                </div>
              )}
              <p className="text-xs text-red-600 mt-3">
                You can update your profile or services based on this feedback, and an admin may re-verify your account.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('profile') }}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('providerProfile.editProfile')}
          </button>
          <button
            onClick={() => { setActiveTab('services') }}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === 'services'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('providerProfile.myServices')}
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Section B - Profile Photo */}
            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('providerProfile.profilePhoto')}</h2>
                
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 mb-4 flex items-center justify-center border-4 border-gray-100">
                    {(photoPreview || profilePhoto) ? (
                      <img 
                        src={photoPreview || profilePhoto} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-4xl text-center">No<br/>Photo</span>
                    )}
                  </div>

                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  
                  <label 
                    htmlFor="photo-upload" 
                    className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition w-full text-center mb-3"
                  >
                    {t('providerProfile.selectImage')}
                  </label>

                  {selectedFile && (
                    <button
                      onClick={handleUploadPhoto}
                      disabled={uploading}
                      className="w-full bg-accent text-white py-2 rounded-md font-semibold hover:bg-teal-600 transition disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Section A - Profile Info */}
            <div className="md:col-span-2">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('providerProfile.profileInfo')}</h2>
                
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerProfile.bio')}</label>
                    <textarea
                      name="bio"
                      rows="4"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder={t('providerProfile.bioPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerProfile.district')}</label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-white"
                      >
                        <option value="">{t('providerProfile.selectDistrict')}</option>
                        {districts.map(d => <option key={d} value={d}>{t(`districts.${d}`, d)}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('providerProfile.cityTown')} <span className="text-gray-400 font-normal">({t('providerProfile.optional')})</span>
                      </label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={!formData.district}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-white ${!formData.district ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      >
                        <option value="">{formData.district ? `${t('providerProfile.allCitiesIn')} ${t(`districts.${formData.district}`, formData.district)}` : t('providerProfile.selectDistrictFirst')}</option>
                        {formData.district && sriLankaCities[formData.district]?.map(c => (
                          <option key={c} value={c}>{t(`cities.${c.replace(/[^a-zA-Z0-9]/g, '')}`, c)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerProfile.nicNumber')}</label>
                    <input
                      name="nicNumber"
                      type="text"
                      value={formData.nicNumber}
                      onChange={handleChange}
                      onBlur={() => setNicError(validateNIC(formData.nicNumber))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${nicError ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter your National Identity Card number"
                    />
                    {nicError && <p className="text-red-500 text-sm mt-1">{nicError}</p>}
                    <p className="text-gray-500 text-xs mt-1">{t('providerProfile.nicFormat')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerProfile.skills')}</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder={t('providerProfile.skillsPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-900 transition"
                      >
                        {t('providerProfile.addSkill')}
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.skills.map((skill, index) => (
                        <span key={index} className="bg-blue-50 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-blue-100">
                          {skill}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-primary hover:text-red-500 font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                      {formData.skills.length === 0 && (
                        <span className="text-gray-400 text-sm">{t('providerProfile.noSkills')}</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={saving || !!nicError}
                      className="w-full bg-primary text-white py-2.5 rounded-md font-semibold hover:bg-blue-900 transition disabled:opacity-50 text-lg"
                    >
                      {saving ? t('providerProfile.savingProfile') : t('providerProfile.saveProfile')}
                    </button>
                  </div>

                </form>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 rounded-xl border border-red-100 p-6 mt-6">
                <h2 className="text-lg font-semibold text-red-800 mb-2">{t('providerProfile.dangerZone')}</h2>
                <p className="text-red-600 text-sm mb-4">
                  {t('providerProfile.deleteWarning')}
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition"
                >
                  {t('providerProfile.deleteAccount')}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-600 font-medium">
                {approvedCount} {t('providerProfile.approved')} &middot; {pendingCount} {t('providerProfile.pending')} &middot; {rejectedCount} {t('providerProfile.rejected')}
              </p>
            </div>

            {services.map(service => (
              <div key={service.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{service.title}</h3>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mt-1 inline-block">
                      {service.category}
                    </span>
                  </div>
                  <div>
                    {service.status === 'APPROVED' && <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">&check; {t('providerProfile.live')}</span>}
                    {service.status === 'PENDING' && <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-medium">&uarr; {t('providerProfile.underReview')}</span>}
                    {service.status === 'REJECTED' && <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">&cross; {t('providerProfile.rejected')}</span>}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                <p className="text-primary font-semibold mb-4">Rs. {service.basePrice}</p>

                {service.status === 'REJECTED' && service.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4 text-sm">
                    <strong>Reason for rejection:</strong> {service.rejectionReason}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingServiceId(service.id)
                      setEditForm({
                        title: service.title,
                        category: service.category,
                        description: service.description,
                        basePrice: service.basePrice
                      })
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {t('providerProfile.edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    {t('providerProfile.delete')}
                  </button>
                </div>

                {editingServiceId === service.id && (
                  <form onSubmit={(e) => handleUpdateService(service.id, e)} className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerProfile.serviceTitle')}</label>
                        <input
                          required
                          value={editForm.title}
                          onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerProfile.serviceCategory')}</label>
                        <select
                          required
                          value={editForm.category}
                          onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">{t('providerProfile.selectCategory')}</option>
                          {categories.map(c => <option key={c} value={c}>{t(`categories.${c}`, c)}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerProfile.serviceDescription')}</label>
                      <textarea
                        value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerProfile.serviceBasePrice')}</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={editForm.basePrice}
                        onChange={e => setEditForm({ ...editForm, basePrice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submittingService}
                        className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-blue-900 transition disabled:opacity-50"
                      >
                        {submittingService ? t('providerProfile.saving') : t('providerProfile.saveChanges')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingServiceId(null)}
                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition"
                      >
                        {t('providerProfile.cancel')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('providerProfile.addNewService')}</h3>
              <form onSubmit={handleAddService} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerProfile.titleRequired')}</label>
                    <input
                      required
                      value={newService.title}
                      onChange={e => setNewService({ ...newService, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder={t('providerProfile.titlePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerProfile.categoryRequired')}</label>
                    <select
                      required
                      value={newService.category}
                      onChange={e => setNewService({ ...newService, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">{t('providerProfile.selectCategory')}</option>
                      {categories.map(c => <option key={c} value={c}>{t(`categories.${c}`, c)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerProfile.serviceDescription')}</label>
                  <textarea
                    value={newService.description}
                    onChange={e => setNewService({ ...newService, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder={t('providerProfile.descPlaceholder')}
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerProfile.basePriceRequired')}</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={newService.basePrice}
                    onChange={e => setNewService({ ...newService, basePrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder={t('providerProfile.pricePlaceholder')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingService}
                  className="bg-accent text-white px-6 py-2 rounded-md font-semibold hover:bg-teal-600 transition disabled:opacity-50"
                >
                  {submittingService ? t('providerProfile.submitting') : t('providerProfile.submitReview')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{t('providerProfile.deleteAccount')}</h2>
            <p className="text-gray-600 text-sm mb-4">
              {t('providerProfile.deleteModalText')}
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
                  {t('providerProfile.cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={deleteConfirmation !== 'DELETE' || deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleteLoading ? t('providerProfile.deleting') : t('providerProfile.permanentlyDelete')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
