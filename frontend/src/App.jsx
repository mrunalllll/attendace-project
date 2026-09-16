// ─────────────────────────────────────────────
//  App.jsx — Main router
//  All pages are listed here.
//  To add a new page: import it and add a <Route>
// ─────────────────────────────────────────────
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Public pages
import LoginPage    from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

// Voter pages
import VoterDashboard  from './pages/voter/VoterDashboard.jsx'
import LiveResults     from './pages/voter/LiveResults.jsx'

// Admin pages
import AdminDashboard  from './pages/admin/AdminDashboard.jsx'
import AdminCandidates from './pages/admin/AdminCandidates.jsx'
import AdminUsers      from './pages/admin/AdminUsers.jsx'
import AdminElection   from './pages/admin/AdminElection.jsx'
import AdminAnalytics  from './pages/admin/AdminAnalytics.jsx'
import AdminLogs       from './pages/admin/AdminLogs.jsx'
import AdminResults    from './pages/admin/AdminResults.jsx'

// ── Protected route wrapper ──────────────────
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="login-wrapper"><div className="text-gradient fw-bold fs-4">Loading...</div></div>
  if (!user)   return <Navigate to="/" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

// ── Main App ─────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"          element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />

          {/* Voter — role 1 */}
          <Route path="/voter/dashboard"    element={<ProtectedRoute role={1}><VoterDashboard /></ProtectedRoute>} />
          <Route path="/voter/live-results" element={<ProtectedRoute role={1}><LiveResults /></ProtectedRoute>} />

          {/* Admin — role 2 */}
          <Route path="/admin/dashboard"  element={<ProtectedRoute role={2}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/candidates" element={<ProtectedRoute role={2}><AdminCandidates /></ProtectedRoute>} />
          <Route path="/admin/users"      element={<ProtectedRoute role={2}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/election"   element={<ProtectedRoute role={2}><AdminElection /></ProtectedRoute>} />
          <Route path="/admin/analytics"  element={<ProtectedRoute role={2}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/logs"       element={<ProtectedRoute role={2}><AdminLogs /></ProtectedRoute>} />
          <Route path="/admin/results"    element={<ProtectedRoute role={2}><AdminResults /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
