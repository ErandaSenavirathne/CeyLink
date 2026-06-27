import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Browse from './pages/Browse'
import ProviderDetail from './pages/ProviderDetail'
import BookingForm from './pages/BookingForm'
import MyBookings from './pages/MyBookings'
import ProviderDashboard from './pages/ProviderDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

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
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/browse" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/browse" /> : <Register />} />
      <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
      <Route path="/provider/:id" element={<ProtectedRoute><ProviderDetail /></ProtectedRoute>} />
      <Route path="/book/:serviceId" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
      <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><ProviderDashboard /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={user ? '/browse' : '/login'} />} />
    </Routes>
  )
}

export default App