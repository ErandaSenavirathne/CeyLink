import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

const categories = [
  'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning',
  'Tutoring', 'Beauty', 'Gardening', 'AC Repair', 'Other'
]

export default function ProviderProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [activeTab, setActiveTab] = useState('profile')

  const [formData, setFormData] = useState({
    bio: '',
    hourlyRate: '',
    district: '',
    skills: [],
    nicNumber: ''
  })
  
  const [nicError, setNicError] = useState(null)

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
        hourlyRate: provider.hourlyRate || '',
        district: provider.district || '',
        skills: provider.skills || [],
        nicNumber: provider.nicNumber || ''
      })
      setProfilePhoto(provider.profilePhoto)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load profile.' })
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
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (e.target.name === 'nicNumber') {
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
    setMessage({ type: '', text: '' })
    try {
      await api.put('/providers/profile', formData)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.error?.includes('already registered')) {
        setNicError(err.response.data.error)
      } else {
        setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUploadPhoto = async () => {
    if (!selectedFile) return
    setUploading(true)
    setMessage({ type: '', text: '' })

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
      setMessage({ type: 'success', text: 'Profile photo updated!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to upload photo.' })
    } finally {
      setUploading(false)
    }
  }

  const handleAddService = async (e) => {
    e.preventDefault()
    setSubmittingService(true)
    setMessage({ type: '', text: '' })
    try {
      const res = await api.post('/providers/services', newService)
      setMessage({ type: 'success', text: res.data.message || 'Service submitted for admin review' })
      setNewService({ category: '', title: '', description: '', basePrice: '' })
      fetchServices()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to add service' })
    } finally {
      setSubmittingService(false)
    }
  }

  const handleUpdateService = async (id, e) => {
    e.preventDefault()
    setSubmittingService(true)
    setMessage({ type: '', text: '' })
    try {
      const res = await api.put(`/providers/services/${id}`, editForm)
      setMessage({ type: 'success', text: res.data.message || 'Service updated' })
      setEditingServiceId(null)
      fetchServices()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update service' })
    } finally {
      setSubmittingService(false)
    }
  }

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return
    try {
      await api.delete(`/providers/services/${id}`)
      fetchServices()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to delete service' })
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
        <h1 className="text-3xl font-bold text-primary mb-2">My Profile</h1>
        <p className="text-gray-500 mb-8">Manage your public provider information and services.</p>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('profile'); setMessage({ type: '', text: '' }) }}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => { setActiveTab('services'); setMessage({ type: '', text: '' }) }}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === 'services'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Services
          </button>
        </div>

        {message.text && (
          <div className={`px-4 py-3 rounded mb-6 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message.text}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Section B - Profile Photo */}
            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Photo</h2>
                
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
                    Select Image
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
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Information</h2>
                
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      name="bio"
                      rows="4"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell customers about your experience and expertise..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (LKR)</label>
                      <input
                        name="hourlyRate"
                        type="number"
                        min="0"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="e.g. 1500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="">Select District</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIC Number</label>
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
                    <p className="text-gray-500 text-xs mt-1">Format: 123456789V or 200012345678 (optional)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="e.g. Plumbing, Wiring, Painting"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-900 transition"
                      >
                        Add
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
                        <span className="text-gray-400 text-sm">No skills added yet.</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={saving || !!nicError}
                      className="w-full bg-primary text-white py-2.5 rounded-md font-semibold hover:bg-blue-900 transition disabled:opacity-50 text-lg"
                    >
                      {saving ? 'Saving Profile...' : 'Save Profile'}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-600 font-medium">
                {approvedCount} Approved &middot; {pendingCount} Pending &middot; {rejectedCount} Rejected
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
                    {service.status === 'APPROVED' && <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">&check; Live</span>}
                    {service.status === 'PENDING' && <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-medium">&uarr; Under Review</span>}
                    {service.status === 'REJECTED' && <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">&cross; Rejected</span>}
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
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>

                {editingServiceId === service.id && (
                  <form onSubmit={(e) => handleUpdateService(service.id, e)} className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          required
                          value={editForm.title}
                          onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          required
                          value={editForm.category}
                          onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (LKR)</label>
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
                        {submittingService ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingServiceId(null)}
                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Service</h3>
              <form onSubmit={handleAddService} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      required
                      value={newService.title}
                      onChange={e => setNewService({ ...newService, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="e.g. Basic Plumbing Repair"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      value={newService.category}
                      onChange={e => setNewService({ ...newService, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newService.description}
                    onChange={e => setNewService({ ...newService, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Describe what's included..."
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (LKR) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={newService.basePrice}
                    onChange={e => setNewService({ ...newService, basePrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="e.g. 2000"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingService}
                  className="bg-accent text-white px-6 py-2 rounded-md font-semibold hover:bg-teal-600 transition disabled:opacity-50"
                >
                  {submittingService ? 'Submitting...' : 'Submit for Review'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
