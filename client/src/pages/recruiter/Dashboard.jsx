import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Briefcase, Users, Edit, Trash2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function RecruiterDashboard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.get('/jobs'),
        api.get('/recruiter/applicants')
      ])
      // Filter to only this recruiter's jobs
      const myJobs = jobsRes.data.filter(j => j.recruiterId === user.id)
      setJobs(myJobs)
      setApplicants(appsRes.data)
    } catch {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return
    setDeleting(jobId)
    try {
      await api.delete(`/jobs/${jobId}`)
      setJobs(prev => prev.filter(j => j.id !== jobId))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete job.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="text-gray-500">Welcome, {user.name}</p>
        </div>
        <Link to="/recruiter/create-job" className="btn-primary flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card text-center">
          <Briefcase className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
          <div className="text-sm text-gray-500">Active Job Postings</div>
        </div>
        <div className="card text-center">
          <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{applicants.length}</div>
          <div className="text-sm text-gray-500">Total Applicants</div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* My Jobs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Job Postings</h2>
          <Link to="/recruiter/applicants" className="text-sm text-blue-600 hover:underline">View All Applicants</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Briefcase className="h-10 w-10 mx-auto mb-2" />
            <p>No job postings yet. <Link to="/recruiter/create-job" className="text-blue-600 hover:underline">Post your first job</Link>!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Job Title</th>
                  <th className="pb-2 font-medium">Company</th>
                  <th className="pb-2 font-medium">Location</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{job.title}</td>
                    <td className="py-3 text-gray-600">{job.company}</td>
                    <td className="py-3 text-gray-600">{job.location}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Link to={`/recruiter/edit-job/${job.id}`} className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
                          <Edit className="h-3 w-3" /> Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(job.id)}
                          disabled={deleting === job.id}
                          className="btn-danger text-xs py-1 px-2 flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          {deleting === job.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
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
