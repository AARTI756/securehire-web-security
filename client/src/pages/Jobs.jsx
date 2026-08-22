import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, MapPin, DollarSign, Search, Building2 } from 'lucide-react'
import api from '../api/axios'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true)
      try {
        const res = await api.get('/jobs', { params: query ? { search: query } : {} })
        setJobs(res.data)
      } catch {
        setError('Failed to load jobs.')
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [query])

  const handleSearch = e => {
    e.preventDefault()
    setQuery(search.trim())
  }

  const formatSalary = (s) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(s)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Listings</h1>
        <p className="text-gray-500">Find your next opportunity</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, company, location…"
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search
        </button>
        {query && (
          <button type="button" onClick={() => { setQuery(''); setSearch('') }} className="btn-secondary">
            Clear
          </button>
        )}
      </form>

      {query && <p className="text-sm text-gray-500 mb-4">Showing results for "<strong>{query}</strong>"</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-600">{error}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No jobs found{query ? ` for "${query}"` : ''}.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map(job => (
            <div key={job.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatSalary(job.salary)} / year
                    </span>
                  </div>
                  <p className="mt-3 text-gray-600 text-sm line-clamp-2">{job.description}</p>
                </div>
                <Link to={`/jobs/${job.id}`} className="btn-primary text-sm whitespace-nowrap">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
