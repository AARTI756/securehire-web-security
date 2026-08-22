import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Lock, Users, Briefcase, CheckCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  const getDashboardLink = () => {
    if (!user) return null
    if (user.role === 'CANDIDATE') return '/candidate/dashboard'
    if (user.role === 'RECRUITER') return '/recruiter/dashboard'
    if (user.role === 'ADMIN') return '/admin/dashboard'
  }

  const features = [
    { icon: Lock, title: 'JWT Authentication', desc: 'Secure token-based authentication with expiry and server-side verification.' },
    { icon: Shield, title: 'RBAC Authorization', desc: 'Role-based access control enforced on every backend endpoint.' },
    { icon: Users, title: 'IDOR Protection', desc: 'Ownership checks prevent accessing other users\' data.' },
    { icon: CheckCircle, title: 'Input Validation', desc: 'All inputs validated server-side with Zod schemas.' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 rounded-full p-4 ring-4 ring-blue-400 ring-opacity-40">
              <Shield className="h-12 w-12" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">SecureHire</h1>
          <p className="text-xl text-blue-200 mb-2">Secure Job Recruitment Portal</p>
          <p className="text-blue-300 mb-8 max-w-2xl mx-auto">
            A Web Application Security demonstration implementing OWASP best practices — JWT auth, RBAC, SQL injection protection, XSS prevention, IDOR protection, rate limiting, and audit logging.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/jobs" className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              <Briefcase className="h-5 w-5" />
              Browse Jobs
            </Link>
            {user ? (
              <Link to={getDashboardLink()} className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg border border-blue-400 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                Go to Dashboard <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <Link to="/register" className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg border border-blue-400 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Security Controls Implemented</h2>
          <p className="text-center text-gray-500 mb-12">Every layer of the application is hardened against common attacks</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card text-center hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Roles */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Three User Roles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { role: 'Candidate', color: 'blue', actions: ['Browse & Apply for Jobs', 'Track Application Status', 'View Personal Profile'] },
              { role: 'Recruiter', color: 'purple', actions: ['Post & Manage Jobs', 'View Applicants', 'Update Application Status'] },
              { role: 'Admin', color: 'red', actions: ['View All Users & Jobs', 'Monitor Applications', 'View Security Audit Logs'] },
            ].map(({ role, color, actions }) => (
              <div key={role} className={`card border-t-4 border-${color}-500`}>
                <h3 className={`font-bold text-lg text-${color}-700 mb-4`}>{role}</h3>
                <ul className="space-y-2">
                  {actions.map(a => (
                    <li key={a} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className={`h-4 w-4 text-${color}-500 mt-0.5 flex-shrink-0`} />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-blue-400" />
          <span className="font-semibold text-white">SecureHire</span>
        </div>
        <p className="text-sm">Web Application Security College Assignment – Demonstration of secure web development practices</p>
      </footer>
    </div>
  )
}
