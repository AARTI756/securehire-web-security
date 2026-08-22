import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Building2, MapPin, DollarSign } from 'lucide-react'
import api from '../../api/axios'

const StatusBadge = ({ status }) => {
  const map = { PENDING: 'badge-pending', ACCEPTED: 'badge-accepted', REJECTED: 'badge-rejected' }
  return <span className={map[status]}>{status}</span>
}

export default function MyApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/applications/my')
      .then(res => setApplications(res.data))
      .catch(() => setError('Failed to load applications.'))
      .finally(() => setLoading(false))
  }, [])

  const formatSalary = s => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(s)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500">Track the status of your job applications</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-600">{error}</div>
      ) : applications.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">You haven't applied for any jobs yet.</p>
          <Link to="/jobs" className="btn-primary inline-flex">Browse Jobs</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map(app => (
            <div key={app.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-gray-900">{app.job?.title}</h2>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{app.job?.company}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{app.job?.location}</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{formatSalary(app.job?.salary)}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Your Resume</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{app.resumeText}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-400 whitespace-nowrap">
                  Applied {new Date(app.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
