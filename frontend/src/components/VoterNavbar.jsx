// ─────────────────────────────────────────────
//  VoterNavbar — top bar for voter pages
//  Props: none (reads from AuthContext)
// ─────────────────────────────────────────────
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function VoterNavbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar-glass">
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="sidebar-logo" style={{ width: 36, height: 36, fontSize: '1rem' }}>
          <i className="bi bi-shield-check" />
        </div>
        <span className="navbar-brand" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
          VoteSecure
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/voter/live-results" className="btn-glass" style={{ padding: '0.4rem 1rem', fontSize: '0.83rem' }}>
          <i className="bi bi-bar-chart-fill me-1" /> Live Results
        </Link>

        <ThemeToggle />

        {/* Avatar dropdown */}
        <div className="dropdown">
          <div
            data-bs-toggle="dropdown"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <img
              src={user?.photo ? `/uploads/${user.photo}` : '/uploads/default.png'}
              className="avatar"
              alt="profile"
            />
            <span style={{ fontSize: '0.83rem', fontWeight: 600 }} className="d-none d-md-inline">
              {user?.name}
            </span>
            <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem', opacity: 0.5 }} />
          </div>
          <ul className="dropdown-menu dropdown-menu-end glass-card border-0">
            <li>
              <button className="dropdown-item" onClick={logout} style={{ color: 'var(--danger)' }}>
                <i className="bi bi-box-arrow-right me-2" /> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
