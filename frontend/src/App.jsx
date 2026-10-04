// ─────────────────────────────────────────────
//  App.jsx — Main router
//  Sandip University — College + Voting System
// ─────────────────────────────────────────────
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// ── Auth pages ───────────────────────────────
import LoginPage    from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

// ── Voter pages (existing) ───────────────────
import VoterDashboard  from './pages/voter/VoterDashboard.jsx'
import LiveResults     from './pages/voter/LiveResults.jsx'

// ── Admin pages (existing) ───────────────────
import AdminDashboard  from './pages/admin/AdminDashboard.jsx'
import AdminCandidates from './pages/admin/AdminCandidates.jsx'
import AdminUsers      from './pages/admin/AdminUsers.jsx'
import AdminElection   from './pages/admin/AdminElection.jsx'
import AdminAnalytics  from './pages/admin/AdminAnalytics.jsx'
import AdminLogs       from './pages/admin/AdminLogs.jsx'
import AdminResults    from './pages/admin/AdminResults.jsx'

// ── Admin pages (new college features) ───────
import AdminDepartments  from './pages/admin/AdminDepartments.jsx'
import AdminEvents       from './pages/admin/AdminEvents.jsx'
import AdminEventPhotos  from './pages/admin/AdminEventPhotos.jsx'
import AdminGallery      from './pages/admin/AdminGallery.jsx'
import AdminAnnouncements from './pages/admin/AdminAnnouncements.jsx'

// ── Public pages (new college features) ──────
import DepartmentsPage      from './pages/public/DepartmentsPage.jsx'
import DepartmentDetailPage from './pages/public/DepartmentDetailPage.jsx'
import EventsPage           from './pages/public/EventsPage.jsx'
import EventDetailPage      from './pages/public/EventDetailPage.jsx'
import GalleryPage          from './pages/public/GalleryPage.jsx'
import SearchPage           from './pages/public/SearchPage.jsx'

// ── Route guards ─────────────────────────────
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="login-wrapper"><div className="text-gradient fw-bold fs-4">Loading...</div></div>
  if (!user)   return <Navigate to="/" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

// Public routes accessible by logged-in voters
function VoterRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user)   return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Auth ─────────────────────────────────── */}
          <Route path="/"         element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Voter — core voting (existing) ───────── */}
          <Route path="/voter/dashboard"    element={<ProtectedRoute role={1}><VoterDashboard /></ProtectedRoute>} />
          <Route path="/voter/live-results" element={<ProtectedRoute role={1}><LiveResults /></ProtectedRoute>} />

          {/* ── Public college pages (voter-accessible) ─ */}
          <Route path="/departments"        element={<VoterRoute><DepartmentsPage /></VoterRoute>} />
          <Route path="/departments/:slug"  element={<VoterRoute><DepartmentDetailPage /></VoterRoute>} />
          <Route path="/events"             element={<VoterRoute><EventsPage /></VoterRoute>} />
          <Route path="/events/:slug"       element={<VoterRoute><EventDetailPage /></VoterRoute>} />
          <Route path="/gallery"            element={<VoterRoute><GalleryPage /></VoterRoute>} />
          <Route path="/search"             element={<VoterRoute><SearchPage /></VoterRoute>} />

          {/* ── Admin — core voting (existing) ────────── */}
          <Route path="/admin/dashboard"  element={<ProtectedRoute role={2}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/candidates" element={<ProtectedRoute role={2}><AdminCandidates /></ProtectedRoute>} />
          <Route path="/admin/users"      element={<ProtectedRoute role={2}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/election"   element={<ProtectedRoute role={2}><AdminElection /></ProtectedRoute>} />
          <Route path="/admin/analytics"  element={<ProtectedRoute role={2}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/logs"       element={<ProtectedRoute role={2}><AdminLogs /></ProtectedRoute>} />
          <Route path="/admin/results"    element={<ProtectedRoute role={2}><AdminResults /></ProtectedRoute>} />

          {/* ── Admin — college management (new) ─────── */}
          <Route path="/admin/departments"              element={<ProtectedRoute role={2}><AdminDepartments /></ProtectedRoute>} />
          <Route path="/admin/events"                   element={<ProtectedRoute role={2}><AdminEvents /></ProtectedRoute>} />
          <Route path="/admin/events/:id/photos"        element={<ProtectedRoute role={2}><AdminEventPhotos /></ProtectedRoute>} />
          <Route path="/admin/gallery"                  element={<ProtectedRoute role={2}><AdminGallery /></ProtectedRoute>} />
          <Route path="/admin/announcements"            element={<ProtectedRoute role={2}><AdminAnnouncements /></ProtectedRoute>} />

          {/* ── Fallback ─────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
