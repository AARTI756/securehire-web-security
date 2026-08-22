import React, { useState, useEffect } from 'react'
import { Briefcase } from 'lucide-react'
import api from '../../api/axios'

export default function AdminJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/jobs')
      .then(res => setJobs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatSalary = s => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(s)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Jobs</h1>
        <p className="text-gray-500">All job postings across all recruiters</p>
      </div>
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-10 text-gray-400"><Briefcase className="h-10 w-10 mx-auto mb-2" /><p>No jobs found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Salary</th>
                  <th className="pb-3 font-medium">Posted By</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 text-gray-400 font-mono">#{j.id}</td>
                    <td className="py-3 font-medium text-gray-900">{j.title}</td>
                    <td className="py-3 text-gray-600">{j.company}</td>
                    <td className="py-3 text-gray-600">{j.location}</td>
                    <td className="py-3 text-gray-600">{formatSalary(j.salary)}</td>
                    <td className="py-3">
                      <div className="text-gray-700">{j.recruiter?.name}</div>
                      <div className="text-gray-400 text-xs">{j.recruiter?.email}</div>
                    </td>
                    <td className="py-3 text-gray-500">{new Date(j.createdAt).toLocaleDateString()}</td>
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
