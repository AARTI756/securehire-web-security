import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Menu, X, LogOut, User, Briefcase, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return null
    if (user.role === 'CANDIDATE') return '/candidate/dashboard'
    if (user.role === 'RECRUITER') return '/recruiter/dashboard'
    if (user.role === 'ADMIN') return '/admin/dashboard'
    return '/'
  }

  const roleColors = {
    CANDIDATE: 'bg-blue-100 text-blue-700',
    RECRUITER: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-red-100 text-red-700',
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl">
              <Shield className="h-6 w-6" />
              <span>SecureHire</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/jobs" className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              Jobs
            </Link>

            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>

                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleColors[user.role]}`}>
                  {user.role}
                </span>

                <span className="text-gray-600 text-sm flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {user.name}
                </span>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-600 hover:text-blue-600">
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-2">
          <Link to="/jobs" className="block py-2 text-gray-600 hover:text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
            Jobs
          </Link>
          {user ? (
            <>
              <Link to={getDashboardLink()} className="block py-2 text-gray-600 hover:text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <div className="py-2 text-sm text-gray-500">{user.name} ({user.role})</div>
              <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="block w-full text-left py-2 text-red-600 font-medium">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-2 text-gray-600 hover:text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="block py-2 text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
