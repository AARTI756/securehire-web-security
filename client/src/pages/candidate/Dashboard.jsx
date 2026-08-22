import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, FileText, User, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function CandidateDashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/applications/my')
      .then(res => setApplications(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'PENDING').length,
    accepted: applications.filter(a => a.status === 'ACCEPTED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  }

  const StatusBadge = ({ status }) => {
    const map = {
      PENDING: 'badge-pending',
      ACCEPTED: 'badge-accepted',
      REJECTED: 'badge-rejected',
    }
    return <span className={map[status] || 'badge-pending'}>{status}</span>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}!</h1>
        <p className="text-gray-500">Your candidate dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Applied', value: stats.total, icon: FileText, color: 'blue' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'yellow' },
          { label: 'Accepted', value: stats.accepted, icon: CheckCircle, color: 'green' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'red' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <div className={`flex justify-center mb-2`}>
              <Icon className={`h-6 w-6 text-${color}-500`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link to="/jobs" className="card hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2 cursor-pointer">
          <Briefcase className="h-8 w-8 text-blue-600" />
          <span className="font-medium">Browse Jobs</span>
          <span className="text-sm text-gray-500">Find new opportunities</span>
        </Link>
        <Link to="/candidate/applications" className="card hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2 cursor-pointer">
          <FileText className="h-8 w-8 text-green-600" />
          <span className="font-medium">My Applications</span>
          <span className="text-sm text-gray-500">Track your progress</span>
        </Link>
        <Link to="/candidate/profile" className="card hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2 cursor-pointer">
          <User className="h-8 w-8 text-purple-600" />
          <span className="font-medium">My Profile</span>
          <span className="text-sm text-gray-500">View account details</span>
        </Link>
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
          <Link to="/candidate/applications" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText className="h-10 w-10 mx-auto mb-2" />
            <p>No applications yet. <Link to="/jobs" className="text-blue-600 hover:underline">Browse jobs</Link> to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Job</th>
                  <th className="pb-2 font-medium">Company</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 5).map(app => (
                  <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{app.job?.title}</td>
                    <td className="py-3 text-gray-600">{app.job?.company}</td>
                    <td className="py-3"><StatusBadge status={app.status} /></td>
                    <td className="py-3 text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
