import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Forbidden() {
  const { user } = useAuth()

  const getDashboard = () => {
    if (!user) return '/'
    if (user.role === 'CANDIDATE') return '/candidate/dashboard'
    if (user.role === 'RECRUITER') return '/recruiter/dashboard'
    if (user.role === 'ADMIN') return '/admin/dashboard'
    return '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-5">
            <ShieldX className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">403</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Access Forbidden</h2>
        <p className="text-gray-500 mb-2 max-w-md">
          You don't have permission to access this resource.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Your role: <strong>{user?.role || 'Not authenticated'}</strong>. Authorization is enforced server-side.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to={getDashboard()} className="btn-primary inline-flex">Go to Dashboard</Link>
          <Link to="/" className="btn-secondary inline-flex">Home</Link>
        </div>
      </div>
    </div>
  )
}
