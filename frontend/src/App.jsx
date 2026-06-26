import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
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
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/browse" element={<div className="p-10 text-center text-2xl">Browse page coming next! Logged in as: {user?.name}</div>} />
      <Route path="/" element={<Navigate to={user ? '/browse' : '/login'} />} />
    </Routes>
  )
}

export default App