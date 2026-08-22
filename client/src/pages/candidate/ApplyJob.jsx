import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Send, ArrowLeft, AlertCircle, CheckCircle, Building2, MapPin, DollarSign } from 'lucide-react'
import api from '../../api/axios'

export default function ApplyJob() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api.get(`/jobs/${jobId}`)
      .then(res => setJob(res.data))
      .catch(() => setError('Job not found.'))
      .finally(() => setLoading(false))
  }, [jobId])

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/applications', {
        jobId: parseInt(jobId),
        resumeText
      })
      setSuccess(true)
      setTimeout(() => navigate('/candidate/applications'), 2000)
    } catch (err) {
      const data = err.response?.data
      if (data?.details) {
        setError(data.details.map(d => d.message).join('. '))
      } else {
        setError(data?.error || 'Failed to submit application.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const formatSalary = s => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(s)

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  if (success) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900">Application Submitted!</h2>
      <p className="text-gray-500 mt-2">Redirecting to your applications…</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to={`/jobs/${jobId}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Job
      </Link>

      {job && (
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <h2 className="font-bold text-gray-900 text-lg mb-1">{job.title}</h2>
          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{job.company}</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
            <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{formatSalary(job.salary)}</span>
          </div>
        </div>
      )}

      <div className="card">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Submit Your Application</h1>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Letter / Resume Text
              <span className="text-gray-400 font-normal ml-1">(min 20 characters)</span>
            </label>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              required
              rows={8}
              placeholder="Describe your experience, skills, and why you're a great fit for this role…"
              className="input-field resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{resumeText.length}/5000 characters</p>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  )
}
