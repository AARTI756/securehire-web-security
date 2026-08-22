import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../../api/axios'

export default function EditJob() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', company: '', description: '', location: '', salary: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api.get(`/jobs/${jobId}`)
      .then(res => {
        const j = res.data
        setForm({ title: j.title, company: j.company, description: j.description, location: j.location, salary: j.salary })
      })
      .catch(() => setError('Job not found or access denied.'))
      .finally(() => setLoading(false))
  }, [jobId])

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setFieldErrors(fe => ({ ...fe, [e.target.name]: undefined }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSaving(true)
    try {
      await api.put(`/jobs/${jobId}`, { ...form, salary: Number(form.salary) })
      setSuccess(true)
      setTimeout(() => navigate('/recruiter/dashboard'), 1500)
    } catch (err) {
      const data = err.response?.data
      if (data?.details) {
        const fieldMap = {}
        data.details.forEach(d => { fieldMap[d.field] = d.message })
        setFieldErrors(fieldMap)
      } else {
        setError(data?.error || 'Failed to update job.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  if (success) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900">Job Updated!</h2>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/recruiter/dashboard" className="inline-flex items-center gap-1 text-blue-600 hover:underline mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>
      <div className="card">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Job Posting</h1>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'title', label: 'Job Title', type: 'text' },
            { name: 'company', label: 'Company Name', type: 'text' },
            { name: 'location', label: 'Location', type: 'text' },
            { name: 'salary', label: 'Annual Salary (USD)', type: 'number' },
          ].map(({ name, label, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} name={name} value={form[name]} onChange={handleChange} className="input-field" required />
              {fieldErrors[name] && <p className="text-red-600 text-xs mt-1">{fieldErrors[name]}</p>}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={6} className="input-field resize-none" required />
            {fieldErrors.description && <p className="text-red-600 text-xs mt-1">{fieldErrors.description}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <Link to="/recruiter/dashboard" className="btn-secondary flex-1 text-center">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
