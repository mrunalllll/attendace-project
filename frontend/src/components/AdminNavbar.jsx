// ─────────────────────────────────────────────
//  AdminNavbar — top bar for admin pages
//  Props: onToggleSidebar, breadcrumb
// ─────────────────────────────────────────────
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function AdminNavbar({ onToggleSidebar, breadcrumb = '' }) {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar-glass" style={{ marginBottom: '1.5rem' }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn-glass" onClick={onToggleSidebar} style={{ padding: '0.4rem 0.7rem' }}>
          <i className="bi bi-list" style={{ fontSize: '1.2rem' }} />
        </button>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0" style={{ fontSize: '0.8rem' }}>
            <li className="breadcrumb-item">
              <span className="text-gradient" style={{ fontWeight: 600 }}>Admin</span>
            </li>
            {breadcrumb && <li className="breadcrumb-item active">{breadcrumb}</li>}
          </ol>
        </nav>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ThemeToggle />

        {/* Profile */}
        <div className="dropdown">
          <div
            data-bs-toggle="dropdown"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <img
              src={user?.photo ? `/uploads/${user.photo}` : '/uploads/default.png'}
              className="avatar"
              alt=""
            />
            <div className="d-none d-md-block">
              <div style={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Administrator</div>
            </div>
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
