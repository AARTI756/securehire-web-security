import React, { useState, useEffect } from 'react'
import { Users, User } from 'lucide-react'
import api from '../../api/axios'

const RoleBadge = ({ role }) => {
  const map = { CANDIDATE: 'badge-candidate', RECRUITER: 'badge-recruiter', ADMIN: 'badge-admin' }
  return <span className={map[role] || 'badge-candidate'}>{role}</span>
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
        <p className="text-gray-500">Registered accounts — password hashes never exposed</p>
      </div>
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div></div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-gray-400"><Users className="h-10 w-10 mx-auto mb-2" /><p>No users found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 text-gray-400 font-mono">#{u.id}</td>
                    <td className="py-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </td>
                    <td className="py-3 text-gray-600">{u.email}</td>
                    <td className="py-3"><RoleBadge role={u.role} /></td>
                    <td className="py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
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
