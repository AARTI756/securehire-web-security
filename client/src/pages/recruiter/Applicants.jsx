import React, { useState, useEffect } from 'react'
import { Users, User, Briefcase, AlertCircle } from 'lucide-react'
import api from '../../api/axios'

const StatusBadge = ({ status }) => {
  const map = { PENDING: 'badge-pending', ACCEPTED: 'badge-accepted', REJECTED: 'badge-rejected' }
  return <span className={map[status]}>{status}</span>
}

export default function Applicants() {
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    api.get('/recruiter/applicants')
      .then(res => setApplicants(res.data))
      .catch(() => setError('Failed to load applicants.'))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (appId, newStatus) => {
    setUpdating(appId)
    try {
      const res = await api.put(`/applications/${appId}/status`, { status: newStatus })
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: res.data.status } : a))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Applicants</h1>
        <p className="text-gray-500">Manage candidates who applied to your job postings</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : applicants.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No applicants yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applicants.map(app => (
            <div key={app.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{app.candidate?.name}</p>
                      <p className="text-sm text-gray-500">{app.candidate?.email}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <Briefcase className="h-4 w-4" />
                    Applied for: <span className="font-medium text-gray-700">{app.job?.title}</span> at <span className="font-medium text-gray-700">{app.job?.company}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Resume</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.resumeText}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[140px]">
                  <select
                    value={app.status}
                    onChange={e => handleStatusChange(app.id, e.target.value)}
                    disabled={updating === app.id}
                    className="input-field text-sm py-1.5"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ACCEPTED">Accept</option>
                    <option value="REJECTED">Reject</option>
                  </select>
                  <p className="text-xs text-gray-400 text-center">
                    Applied {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
