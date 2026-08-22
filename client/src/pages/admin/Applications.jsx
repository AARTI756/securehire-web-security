import React, { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import api from '../../api/axios'

const StatusBadge = ({ status }) => {
  const map = { PENDING: 'badge-pending', ACCEPTED: 'badge-accepted', REJECTED: 'badge-rejected' }
  return <span className={map[status]}>{status}</span>
}

export default function AdminApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/applications')
      .then(res => setApplications(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Applications</h1>
        <p className="text-gray-500">All job applications across all candidates</p>
      </div>
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div></div>
        ) : applications.length === 0 ? (
          <div className="text-center py-10 text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2" /><p>No applications found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Candidate</th>
                  <th className="pb-3 font-medium">Job</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 text-gray-400 font-mono">#{a.id}</td>
                    <td className="py-3">
                      <div className="font-medium text-gray-900">{a.candidate?.name}</div>
                      <div className="text-gray-400 text-xs">{a.candidate?.email}</div>
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-gray-900">{a.job?.title}</div>
                      <div className="text-gray-400 text-xs">{a.job?.company}</div>
                    </td>
                    <td className="py-3"><StatusBadge status={a.status} /></td>
                    <td className="py-3 text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
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
