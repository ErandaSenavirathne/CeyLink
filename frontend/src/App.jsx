import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Register from './pages/Register'
import Browse from './pages/Browse'
import ProviderDetail from './pages/ProviderDetail'
import BookingForm from './pages/BookingForm'
import MyBookings from './pages/MyBookings'
import ProviderDashboard from './pages/ProviderDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import AdminDashboard from './pages/AdminDashboard'
import ProviderProfile from './pages/ProviderProfile'
import MyProfile from './pages/MyProfile'
import Landing from './pages/Landing'
import ScrollToTop from './components/ScrollToTop'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={user ? (<Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'PROVIDER' ? '/dashboard' : '/browse'} />) : (<Landing />)} />
      <Route path="/login" element={user ? (<Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'PROVIDER' ? '/dashboard' : '/browse'} />) : (<Login />)} />
      <Route path="/admin/login" element={user ? (<Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'PROVIDER' ? '/dashboard' : '/browse'} />) : (<AdminLogin />)} />
      <Route path="/register" element={user ? (<Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'PROVIDER' ? '/dashboard' : '/browse'} />) : (<Register />)} />
      <Route path="/" element={<Navigate to={!user ? '/login' : user.role === 'ADMIN' ? '/admin' : user.role === 'PROVIDER' ? '/dashboard' : '/browse'} />} />
      <Route path="/browse" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PROVIDER']}><Browse /></ProtectedRoute>} />
      <Route path="/provider/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PROVIDER']}><ProviderDetail /></ProtectedRoute>} />
      <Route path="/book/:serviceId" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><BookingForm /></ProtectedRoute>} />
      <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><MyBookings /></ProtectedRoute>} />
      <Route path="/my-profile" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><MyProfile /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderDashboard /></ProtectedRoute>} />
      <Route path="/provider-profile" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderProfile /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
    </Routes>
    </>
  )
}

export default App