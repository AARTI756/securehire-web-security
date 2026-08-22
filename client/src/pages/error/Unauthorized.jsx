import React from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-yellow-100 rounded-full p-5">
            <Lock className="h-12 w-12 text-yellow-600" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">401</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Authentication Required</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          You must be logged in to access this page. Please sign in with valid credentials.
        </p>
        <Link to="/login" className="btn-primary inline-flex">Go to Login</Link>
      </div>
    </div>
  )
}
