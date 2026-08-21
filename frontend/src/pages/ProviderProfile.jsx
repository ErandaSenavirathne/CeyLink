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

export default function ProviderProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [formData, setFormData] = useState({
    bio: '',
    hourlyRate: '',
    district: '',
    skills: [],
    nicNumber: ''
  })
  
  const [skillInput, setSkillInput] = useState('')
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    if (user && user.role !== 'PROVIDER') {
      navigate('/')
      return
    }
    fetchProfile()
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      await api.put('/providers/profile', formData)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="text-center text-gray-500 mt-10">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-2">My Profile</h1>
        <p className="text-gray-500 mb-8">Manage your public provider information.</p>

        {message.text && (
          <div className={`px-4 py-3 rounded mb-6 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message.text}
          </div>
        )}

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Enter your National Identity Card number"
                  />
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
                    disabled={saving}
                    className="w-full bg-primary text-white py-2.5 rounded-md font-semibold hover:bg-blue-900 transition disabled:opacity-50 text-lg"
                  >
                    {saving ? 'Saving Profile...' : 'Save Profile'}
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
