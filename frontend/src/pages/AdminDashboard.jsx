import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'

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
  const [reports, setReports] = useState([])
  const [rejectReasons, setRejectReasons] = useState({})
  const [providerRejectReasons, setProviderRejectReasons] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)
  const [currentUserData, setCurrentUserData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const queryParams = []
      if (filterStartDate) queryParams.push(`startDate=${filterStartDate}`)
      if (filterEndDate) queryParams.push(`endDate=${filterEndDate}`)
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : ''

      const [statsRes, providersRes, usersRes, bookingsRes, servicesRes, reportsRes] = await Promise.all([
        api.get(`/admin/stats${queryString}`),
        api.get('/admin/providers'),
        api.get('/admin/users'),
        api.get(`/admin/bookings${queryString}`),
        api.get('/admin/services/pending'),
        api.get(`/reports${queryString}`)
      ])
      setStats(statsRes.data)
      setProviders(providersRes.data)
      setUsers(usersRes.data)
      setBookings(bookingsRes.data)
      setPendingServices(servicesRes.data)
      setReports(reportsRes.data)
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Admin access required')
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
        verificationStatus: status,
        rejectionReason: status === 'REJECTED' ? providerRejectReasons[providerId] : undefined
      })
      setProviderRejectReasons(prev => {
        const next = { ...prev }
        delete next[providerId]
        return next
      })
      await fetchAll()
      toast.success('Provider verification updated')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
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
      toast.success('Service updated successfully')
      await fetchAll()
    } catch (err) {
      toast.error('Failed to update service')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleUpdateReport = async (reportId, status) => {
    try {
      await api.patch(`/reports/${reportId}/status`, { status })
      setReports(reports.map(r => r.id === reportId ? { ...r, status } : r))
      toast.success('Report status updated')
    } catch (err) {
      toast.error('Failed to update report status')
    }
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    setUpdatingId('user-modal')
    try {
      if (currentUserData.id) {
        await api.put(`/admin/users/${currentUserData.id}`, currentUserData)
        toast.success('User updated successfully')
      } else {
        await api.post('/admin/users', currentUserData)
        toast.success('User created successfully')
      }
      setShowUserModal(false)
      setCurrentUserData(null)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save user')
    } finally {
      setUpdatingId(null)
    }
  }

  const tabs = ['overview', 'providers', 'services', 'users', 'bookings', 'reports']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO title="Admin Dashboard | Loading..." />
        <Navbar />
        <p className="text-center text-gray-500 mt-10">Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <SEO title="Admin Dashboard | CeyLink" />
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Admin Dashboard</h1>
        <p className="text-gray-500 mb-6">Platform management and oversight</p>

        {/* Global Date & Time Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Start Date & Time</label>
            <input
              type="datetime-local"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">End Date & Time</label>
            <input
              type="datetime-local"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-gray-50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchAll()}
              className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-900 transition shadow-sm"
            >
              Apply Filter
            </button>
            <button
              onClick={() => {
                setFilterStartDate('')
                setFilterEndDate('')
                // Wait for state to update, then fetch (in a real app, useEffect handles this better, but here we can just pass empty strings to a fetch variant, or just setTimeout)
                setTimeout(() => {
                  window.location.reload()
                }, 50)
              }}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-200 transition"
            >
              Clear
            </button>
          </div>
        </div>

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
              {tab === 'reports' && reports.filter(r => r.status === 'PENDING').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {reports.filter(r => r.status === 'PENDING').length}
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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Revenue Trend (Last 30 Days)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.trends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{fontSize: 12}} minTickGap={30} />
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip formatter={(value) => `Rs. ${value}`} />
                      <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Daily Bookings (Last 30 Days)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.trends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{fontSize: 12}} minTickGap={30} />
                      <YAxis tick={{fontSize: 12}} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
                <h3 className="font-semibold text-gray-800 mb-4">User Distribution</h3>
                <div className="h-64 flex justify-center items-center">
                  <ResponsiveContainer width="50%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.userDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.userDistribution?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#6366f1'][index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="flex flex-col justify-center gap-3 w-1/2 max-w-xs pl-8">
                    {stats.userDistribution?.map((entry, index) => (
                      <div key={entry.name} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#3b82f6', '#10b981', '#6366f1'][index % 3] }} />
                          <span className="text-sm text-gray-600 capitalize">{entry.name.toLowerCase()}s</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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

                {provider.verificationStatus === 'REJECTED' && provider.rejectionReason && (
                  <div className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100">
                    <span className="font-semibold block mb-1">Reason for revocation: </span>
                    {provider.rejectionReason}
                  </div>
                )}

                {provider.verificationStatus === 'PENDING' && (
                  <div className="flex flex-col gap-2 mt-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateVerification(provider.id, 'VERIFIED')}
                        disabled={updatingId === provider.id}
                        className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 w-32"
                      >
                        {updatingId === provider.id ? 'Updating...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => {
                          if (providerRejectReasons[provider.id] === undefined) {
                            setProviderRejectReasons(prev => ({ ...prev, [provider.id]: '' }))
                          } else {
                            setProviderRejectReasons(prev => {
                              const next = { ...prev }
                              delete next[provider.id]
                              return next
                            })
                          }
                        }}
                        className="border border-red-500 text-red-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-50 transition w-32"
                      >
                        Reject
                      </button>
                    </div>
                    {providerRejectReasons[provider.id] !== undefined && (
                      <div className="mt-2 flex flex-col gap-2 max-w-md">
                        <textarea
                          placeholder="Enter reason for rejection (required)..."
                          value={providerRejectReasons[provider.id]}
                          onChange={e => setProviderRejectReasons(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:border-red-400"
                          rows="2"
                        />
                        <button
                          onClick={() => updateVerification(provider.id, 'REJECTED')}
                          disabled={!providerRejectReasons[provider.id].trim() || updatingId === provider.id}
                          className="bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 self-start"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {provider.verificationStatus === 'VERIFIED' && (
                  <div className="flex flex-col gap-2 mt-3">
                    <button
                      onClick={() => {
                        if (providerRejectReasons[provider.id] === undefined) {
                          setProviderRejectReasons(prev => ({ ...prev, [provider.id]: '' }))
                        } else {
                          setProviderRejectReasons(prev => {
                            const next = { ...prev }
                            delete next[provider.id]
                            return next
                          })
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700 transition self-start font-medium"
                    >
                      Revoke verification
                    </button>
                    {providerRejectReasons[provider.id] !== undefined && (
                      <div className="mt-2 flex flex-col gap-2 max-w-md">
                        <textarea
                          placeholder="Enter reason for revocation (required)..."
                          value={providerRejectReasons[provider.id]}
                          onChange={e => setProviderRejectReasons(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:border-red-400"
                          rows="2"
                        />
                        <button
                          onClick={() => updateVerification(provider.id, 'REJECTED')}
                          disabled={!providerRejectReasons[provider.id].trim() || updatingId === provider.id}
                          className="bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 self-start"
                        >
                          Confirm Revoke
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {provider.verificationStatus === 'REJECTED' && (
                  <button
                    onClick={() => updateVerification(provider.id, 'VERIFIED')}
                    disabled={updatingId === provider.id}
                    className="mt-3 bg-green-50 text-green-600 border border-green-200 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-100 transition"
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
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Manage Users</h2>
              <button
                onClick={() => {
                  setCurrentUserData({ name: '', email: '', password: '', role: 'CUSTOMER', isActive: true })
                  setShowUserModal(true)
                }}
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-900 transition flex items-center gap-1"
              >
                + Add New User
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
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
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCurrentUserData(user)
                              setShowUserModal(true)
                            }}
                            className="text-primary hover:text-blue-900 font-medium transition"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-lg shadow-sm">
                <p className="text-gray-500">No reports have been filed.</p>
              </div>
            ) : (
              reports.map(report => (
                <div key={report.id} className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {report.status}
                        </span>
                        <h3 className="font-medium text-gray-800">{report.reason}</h3>
                        <span className="text-sm text-gray-500">• {new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium text-gray-700">Reported Provider:</span> {report.provider.user.name} 
                        {report.provider.verificationStatus === 'REJECTED' && (
                          <span className="ml-2 text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">REVOKED</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium text-gray-700">Reported By:</span> {report.customer.name} ({report.customer.email})
                      </div>
                      
                      {report.description && (
                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 mt-2">
                          "{report.description}"
                        </div>
                      )}
                    </div>
                    
                    {report.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateReport(report.id, 'DISMISSED')}
                          className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleUpdateReport(report.id, 'RESOLVED')}
                          className="px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:bg-blue-900"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && currentUserData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                {currentUserData.id ? 'Edit User' : 'Add New User'}
              </h2>
              <button 
                onClick={() => {
                  setShowUserModal(false)
                  setCurrentUserData(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={currentUserData.name}
                  onChange={(e) => setCurrentUserData({ ...currentUserData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={currentUserData.email}
                  onChange={(e) => setCurrentUserData({ ...currentUserData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              {!currentUserData.id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={currentUserData.password}
                    onChange={(e) => setCurrentUserData({ ...currentUserData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={currentUserData.role}
                    onChange={(e) => setCurrentUserData({ ...currentUserData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="PROVIDER">Provider</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                
                {currentUserData.id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={currentUserData.isActive ? 'true' : 'false'}
                      onChange={(e) => setCurrentUserData({ ...currentUserData, isActive: e.target.value === 'true' })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white font-medium ${
                        currentUserData.isActive ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'
                      }`}
                    >
                      <option value="true">Active</option>
                      <option value="false">Deactivated</option>
                    </select>
                  </div>
                )}
              </div>
              
              {currentUserData.id && !currentUserData.isActive && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded border border-red-100">
                  <strong>Warning:</strong> Deactivating a user prevents them from logging into the platform entirely.
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId === 'user-modal'}
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-900 transition disabled:opacity-50"
                >
                  {updatingId === 'user-modal' ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}