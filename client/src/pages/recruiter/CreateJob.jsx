import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../../api/axios'

export default function CreateJob() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', company: '', description: '', location: '', salary: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState(false)

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setFieldErrors(fe => ({ ...fe, [e.target.name]: undefined }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      await api.post('/jobs', { ...form, salary: Number(form.salary) })
      setSuccess(true)
      setTimeout(() => navigate('/recruiter/dashboard'), 1500)
    } catch (err) {
      const data = err.response?.data
      if (data?.details) {
        const fieldMap = {}
        data.details.forEach(d => { fieldMap[d.field] = d.message })
        setFieldErrors(fieldMap)
      } else {
        setError(data?.error || 'Failed to create job.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900">Job Posted!</h2>
      <p className="text-gray-500 mt-2">Redirecting to your dashboard…</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/recruiter/dashboard" className="inline-flex items-center gap-1 text-blue-600 hover:underline mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="card">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Post a New Job</h1>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'title', label: 'Job Title', placeholder: 'e.g. Senior Software Engineer', type: 'text' },
            { name: 'company', label: 'Company Name', placeholder: 'e.g. SecureHire Corp', type: 'text' },
            { name: 'location', label: 'Location', placeholder: 'e.g. Remote / New York, NY', type: 'text' },
            { name: 'salary', label: 'Annual Salary (USD)', placeholder: 'e.g. 120000', type: 'number' },
          ].map(({ name, label, placeholder, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} className="input-field" required />
              {fieldErrors[name] && <p className="text-red-600 text-xs mt-1">{fieldErrors[name]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={6}
              placeholder="Describe the role, responsibilities, requirements…"
              className="input-field resize-none"
              required
            />
            {fieldErrors.description && <p className="text-red-600 text-xs mt-1">{fieldErrors.description}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Publishing…' : 'Publish Job'}
            </button>
            <Link to="/recruiter/dashboard" className="btn-secondary flex-1 text-center">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
