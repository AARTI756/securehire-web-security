import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, DollarSign, Building2, Calendar, ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function JobDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(res => setJob(res.data))
      .catch(() => setError('Job not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const formatSalary = (s) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(s)
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )

  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-red-600 text-lg">{error}</p>
      <Link to="/jobs" className="btn-primary mt-4 inline-flex">Back to Jobs</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/jobs" className="inline-flex items-center gap-1 text-blue-600 hover:underline mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
          <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{job.company}</span>
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
          <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{formatSalary(job.salary)} / year</span>
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Posted {formatDate(job.createdAt)}</span>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h2 className="font-semibold text-gray-900 mb-3">Job Description</h2>
          {/* React renders text safely by default — XSS protected */}
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>

        <div className="mt-8 flex gap-3">
          {user?.role === 'CANDIDATE' && (
            <Link to={`/candidate/apply/${job.id}`} className="btn-primary flex items-center gap-2">
              <Send className="h-4 w-4" />
              Apply Now
            </Link>
          )}
          {!user && (
            <Link to="/login" className="btn-primary">Login to Apply</Link>
          )}
        </div>
      </div>
    </div>
  )
}
