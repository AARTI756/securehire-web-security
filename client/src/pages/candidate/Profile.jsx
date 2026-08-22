import React, { useState, useEffect } from 'react'
import { User, Mail, Shield, Calendar } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function CandidateProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/profile')
      .then(res => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  const data = profile || user

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>
      <div className="card">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <User className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{data?.name}</h2>
          <span className="badge-candidate mt-2">{data?.role}</span>
        </div>
        <div className="space-y-4 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-3 text-gray-700">
            <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email</p>
              <p className="font-medium">{data?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Shield className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Account Role</p>
              <p className="font-medium">{data?.role}</p>
            </div>
          </div>
          {data?.createdAt && (
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Member Since</p>
                <p className="font-medium">{new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
          <p className="font-semibold text-gray-600 mb-1">🔒 Security Note</p>
          Password hashes are never stored in plaintext or returned via the API. Your identity is verified server-side via JWT on every request.
        </div>
      </div>
    </div>
  )
}
