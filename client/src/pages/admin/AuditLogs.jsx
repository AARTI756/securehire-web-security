import React, { useState, useEffect } from 'react'
import { Activity, Shield } from 'lucide-react'
import api from '../../api/axios'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    api.get('/admin/logs')
      .then(res => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter
    ? logs.filter(l => l.action.toLowerCase().includes(filter.toLowerCase()) || l.user?.email?.toLowerCase().includes(filter.toLowerCase()))
    : logs

  const isSecurityAlert = (action) => {
    const alertKeywords = ['UNAUTHORIZED', 'FAILED', 'DENIED', 'ATTEMPT', 'INVALID', 'EXPIRED', 'ERROR']
    return alertKeywords.some(kw => action.toUpperCase().includes(kw))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Security Audit Logs</h1>
        </div>
        <p className="text-gray-500">All security-relevant events recorded by the system</p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by action or email…"
          className="input-field max-w-md"
        />
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400"><Activity className="h-10 w-10 mx-auto mb-2" /><p>No logs found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-3 px-4 font-medium">Timestamp</th>
                  <th className="py-3 px-4 font-medium">User</th>
                  <th className="py-3 px-4 font-medium">Action</th>
                  <th className="py-3 px-4 font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr
                    key={log.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 ${isSecurityAlert(log.action) ? 'bg-red-50' : ''}`}
                  >
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {log.user ? (
                        <div>
                          <div className="font-medium text-gray-900">{log.user.name}</div>
                          <div className="text-xs text-gray-400">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Guest / Unknown</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-mono text-xs ${isSecurityAlert(log.action) ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Rows highlighted in red indicate security events (failed logins, unauthorized access attempts, etc.)
        Passwords and secrets are never logged.
      </p>
    </div>
  )
}
