import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

// Public Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Jobs from './pages/Jobs'
import JobDetails from './pages/JobDetails'

// Candidate Pages
import CandidateDashboard from './pages/candidate/Dashboard'
import MyApplications from './pages/candidate/MyApplications'
import ApplyJob from './pages/candidate/ApplyJob'
import CandidateProfile from './pages/candidate/Profile'

// Recruiter Pages
import RecruiterDashboard from './pages/recruiter/Dashboard'
import CreateJob from './pages/recruiter/CreateJob'
import EditJob from './pages/recruiter/EditJob'
import Applicants from './pages/recruiter/Applicants'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminJobs from './pages/admin/Jobs'
import AdminApplications from './pages/admin/Applications'
import AuditLogs from './pages/admin/AuditLogs'

// Error Pages
import Unauthorized from './pages/error/Unauthorized'
import Forbidden from './pages/error/Forbidden'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetails />} />

            {/* Error pages */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/forbidden" element={<Forbidden />} />

            {/* Candidate */}
            <Route path="/candidate/dashboard" element={
              <ProtectedRoute roles={['CANDIDATE']}><CandidateDashboard /></ProtectedRoute>
            } />
            <Route path="/candidate/applications" element={
              <ProtectedRoute roles={['CANDIDATE']}><MyApplications /></ProtectedRoute>
            } />
            <Route path="/candidate/apply/:jobId" element={
              <ProtectedRoute roles={['CANDIDATE']}><ApplyJob /></ProtectedRoute>
            } />
            <Route path="/candidate/profile" element={
              <ProtectedRoute roles={['CANDIDATE']}><CandidateProfile /></ProtectedRoute>
            } />

            {/* Recruiter */}
            <Route path="/recruiter/dashboard" element={
              <ProtectedRoute roles={['RECRUITER']}><RecruiterDashboard /></ProtectedRoute>
            } />
            <Route path="/recruiter/create-job" element={
              <ProtectedRoute roles={['RECRUITER']}><CreateJob /></ProtectedRoute>
            } />
            <Route path="/recruiter/edit-job/:jobId" element={
              <ProtectedRoute roles={['RECRUITER']}><EditJob /></ProtectedRoute>
            } />
            <Route path="/recruiter/applicants" element={
              <ProtectedRoute roles={['RECRUITER']}><Applicants /></ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>
            } />
            <Route path="/admin/jobs" element={
              <ProtectedRoute roles={['ADMIN']}><AdminJobs /></ProtectedRoute>
            } />
            <Route path="/admin/applications" element={
              <ProtectedRoute roles={['ADMIN']}><AdminApplications /></ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
              <ProtectedRoute roles={['ADMIN']}><AuditLogs /></ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
