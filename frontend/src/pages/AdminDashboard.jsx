import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

const statusStyles = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  VERIFIED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700'
}

const bookingStatusStyles = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [providers, setProviders] = useState([])
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [pendingServices, setPendingServices] = useState([])
  const [rejectReasons, setRejectReasons] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [statsRes, providersRes, usersRes, bookingsRes, servicesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/providers'),
        api.get('/admin/users'),
        api.get('/admin/bookings'),
        api.get('/admin/services/pending')
      ])
      setStats(statsRes.data)
      setProviders(providersRes.data)
      setUsers(usersRes.data)
      setBookings(bookingsRes.data)
      setPendingServices(servicesRes.data)
    } catch (err) {
      if (err.response?.status === 403) {
        alert('Admin access required')
        navigate('/browse')
      }
    } finally {
      setLoading(false)
    }
  }

  const updateVerification = async (providerId, status) => {
    setUpdatingId(providerId)
    try {
      await api.patch(`/admin/providers/${providerId}/verify`, {
        verificationStatus: status
      })
      await fetchAll()
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReviewService = async (serviceId, action) => {
    setUpdatingId(serviceId)
    try {
      await api.patch(`/admin/services/${serviceId}/review`, {
        action,
        rejectionReason: action === 'REJECT' ? rejectReasons[serviceId] : undefined
      })
      setRejectReasons(prev => {
        const next = { ...prev }
        delete next[serviceId]
        return next
      })
      await fetchAll()
    } catch (err) {
      alert(err.response?.data?.error || 'Review failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const tabs = ['overview', 'providers', 'services', 'users', 'bookings']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="text-center text-gray-500 mt-10">Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Admin Dashboard</h1>
        <p className="text-gray-500 mb-6">Platform management and oversight</p>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {tab === 'providers' && stats?.pendingProviders > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {stats.pendingProviders}
                </span>
              )}
              {tab === 'services' && pendingServices.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingServices.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Users', value: stats.totalUsers, color: 'text-blue-600' },
                { label: 'Total Providers', value: stats.totalProviders, color: 'text-purple-600' },
                { label: 'Total Bookings', value: stats.totalBookings, color: 'text-amber-600' },
                { label: 'Pending Verification', value: stats.pendingProviders, color: 'text-red-600' },
                { label: 'Pending Services', value: pendingServices.length, color: 'text-orange-600' },
                { label: 'Completed Jobs', value: stats.completedBookings, color: 'text-green-600' },
                { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, color: 'text-primary' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-lg p-5 shadow-sm">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Pending verifications alert */}
            {stats.pendingProviders > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-amber-800">
                    {stats.pendingProviders} provider{stats.pendingProviders > 1 ? 's' : ''} awaiting verification
                  </p>
                  <p className="text-sm text-amber-600">Review and approve or reject their applications</p>
                </div>
                <button
                  onClick={() => setActiveTab('providers')}
                  className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-700 transition"
                >
                  Review Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div className="space-y-4">
            {providers.length === 0 && (
              <p className="text-gray-500 text-center py-8">No providers found.</p>
            )}
            {providers.map((provider) => (
              <div key={provider.id} className="bg-white rounded-lg shadow-sm p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{provider.user.name}</h3>
                    <p className="text-sm text-gray-500">{provider.user.email}</p>
                    <p className="text-sm text-gray-500">{provider.district} · {provider.user.phone || 'No phone'}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusStyles[provider.verificationStatus]}`}>
                    {provider.verificationStatus}
                  </span>
                </div>

                <div className="flex gap-4 text-sm text-gray-500 mb-3">
                  <span>📋 {provider.services.length} services</span>
                  <span>📅 {provider._count.bookings} bookings</span>
                  <span>⭐ {provider._count.reviews} reviews</span>
                </div>

                {provider.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {provider.services.map(s => (
                      <span key={s.id} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                        {s.category} — Rs. {s.basePrice}
                      </span>
                    ))}
                  </div>
                )}

                {provider.verificationStatus === 'PENDING' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => updateVerification(provider.id, 'VERIFIED')}
                      disabled={updatingId === provider.id}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {updatingId === provider.id ? 'Updating...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => updateVerification(provider.id, 'REJECTED')}
                      disabled={updatingId === provider.id}
                      className="bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-100 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {provider.verificationStatus === 'VERIFIED' && (
                  <button
                    onClick={() => updateVerification(provider.id, 'REJECTED')}
                    disabled={updatingId === provider.id}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 transition"
                  >
                    Revoke verification
                  </button>
                )}

                {provider.verificationStatus === 'REJECTED' && (
                  <button
                    onClick={() => updateVerification(provider.id, 'VERIFIED')}
                    disabled={updatingId === provider.id}
                    className="mt-2 bg-green-50 text-green-600 border border-green-200 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-100 transition"
                  >
                    Approve instead
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {pendingServices.length === 0 && (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center font-medium">
                All services reviewed — nothing pending
              </div>
            )}
            {pendingServices.map(service => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{service.title}</h3>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mt-1 inline-block">
                      {service.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">Rs. {service.basePrice}</p>
                    <p className="text-xs text-gray-500 mt-1">Submitted: {new Date(service.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {service.description && (
                  <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                )}
                
                <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded border border-gray-100">
                  <span className="font-medium text-gray-700">Provider:</span> {service.provider.user.name} ({service.provider.user.email})
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReviewService(service.id, 'APPROVE')}
                      disabled={updatingId === service.id}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 w-32"
                    >
                      {updatingId === service.id ? 'Updating...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => {
                        if (rejectReasons[service.id] === undefined) {
                          setRejectReasons(prev => ({ ...prev, [service.id]: '' }))
                        } else {
                          setRejectReasons(prev => {
                            const next = { ...prev }
                            delete next[service.id]
                            return next
                          })
                        }
                      }}
                      className="border border-red-500 text-red-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-50 transition w-32"
                    >
                      Reject
                    </button>
                  </div>
                  
                  {rejectReasons[service.id] !== undefined && (
                    <div className="mt-3 flex flex-col gap-2 max-w-md">
                      <textarea
                        placeholder="Enter reason for rejection (required)..."
                        value={rejectReasons[service.id]}
                        onChange={e => setRejectReasons(prev => ({ ...prev, [service.id]: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:border-red-400"
                        rows="2"
                      />
                      <button
                        onClick={() => handleReviewService(service.id, 'REJECT')}
                        disabled={!rejectReasons[service.id].trim() || updatingId === service.id}
                        className="bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 self-start"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Email', 'Role', 'District', 'Joined'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'PROVIDER' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.district || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-3">
            {bookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">{booking.service.title}</h3>
                    <p className="text-sm text-gray-500">
                      {booking.customer.name} → {booking.provider.user.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      📅 {new Date(booking.bookingDate).toLocaleDateString()} · 🕐 {booking.timeSlot}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${bookingStatusStyles[booking.status]}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                    <p className="text-sm font-semibold text-primary mt-1">Rs. {booking.totalAmount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}