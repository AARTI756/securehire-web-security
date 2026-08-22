import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Briefcase, FileText, Shield, Activity } from 'lucide-react'
import api from '../../api/axios'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, jobs: 0, applications: 0, logs: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/users'),
      api.get('/admin/jobs'),
      api.get('/admin/applications'),
      api.get('/admin/logs'),
    ]).then(([users, jobs, apps, logs]) => {
      setStats({
        users: users.data.length,
        jobs: jobs.data.length,
        applications: apps.data.length,
        logs: logs.data.length,
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, to: '/admin/users', color: 'blue' },
    { label: 'Job Listings', value: stats.jobs, icon: Briefcase, to: '/admin/jobs', color: 'purple' },
    { label: 'Applications', value: stats.applications, icon: FileText, to: '/admin/applications', color: 'green' },
    { label: 'Audit Events', value: stats.logs, icon: Activity, to: '/admin/logs', color: 'red' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <p className="text-gray-500">System-wide oversight and security monitoring</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to} className="card hover:shadow-md transition-shadow text-center cursor-pointer">
            <div className="flex justify-center mb-3">
              <div className={`bg-${color}-100 rounded-full p-3`}>
                <Icon className={`h-6 w-6 text-${color}-600`} />
              </div>
            </div>
            {loading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse mx-4 mb-2"></div>
            ) : (
              <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
            )}
            <div className="text-sm text-gray-500">{label}</div>
          </Link>
        ))}
      </div>

      <div className="card bg-red-50 border-red-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 mb-1">Admin Access — Security Notice</p>
            <p className="text-sm text-red-700">
              All admin actions are logged in the audit trail. Authorization is enforced server-side via JWT and RBAC middleware.
              Admin credentials are hashed with bcrypt and never exposed through the API.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
