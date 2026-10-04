// ─────────────────────────────────────────────
//  AdminSidebar — left navigation for admin pages
//  To add a new menu item: add an entry to navItems array
// ─────────────────────────────────────────────
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SandipLogo from './SandipLogo'

// ── Navigation items — easy to add/remove ────
const navItems = [
  { section: 'Main' },
  { to: '/admin/dashboard',      icon: 'bi-grid-1x2-fill',       label: 'Dashboard' },
  { to: '/admin/results',        icon: 'bi-bar-chart-fill',       label: 'Live Results' },
  { to: '/admin/analytics',      icon: 'bi-graph-up-arrow',       label: 'Analytics' },

  { section: 'Voting System' },
  { to: '/admin/candidates',     icon: 'bi-person-badge-fill',    label: 'Candidates' },
  { to: '/admin/users',          icon: 'bi-people-fill',          label: 'Voters' },
  { to: '/admin/election',       icon: 'bi-flag-fill',            label: 'Election' },

  { section: 'College' },
  { to: '/admin/departments',    icon: 'bi-building-fill',        label: 'Departments' },
  { to: '/admin/events',         icon: 'bi-calendar-event-fill',  label: 'Events' },
  { to: '/admin/announcements',  icon: 'bi-megaphone-fill',       label: 'Announcements' },
  { to: '/admin/gallery',        icon: 'bi-images',               label: 'Gallery' },

  { section: 'System' },
  { to: '/admin/logs',           icon: 'bi-journal-text',         label: 'Activity Logs' },
  { to: '/voter/dashboard',      icon: 'bi-house-fill',           label: 'Public Site' },
]

export default function AdminSidebar({ collapsed }) {
  const { logout, user } = useAuth()

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} id="sidebar">
      {/* Brand */}
      <NavLink to="/admin/dashboard" className="sidebar-brand" style={{ gap: '0.6rem' }}>
        <SandipLogo size={collapsed ? 36 : 40} full={!collapsed} />
      </NavLink>

      {/* Nav */}
      <nav style={{ flexGrow: 1, paddingBottom: '1rem', overflowY: 'auto' }}>
        {navItems.map((item, i) =>
          item.section ? (
            !collapsed && <div key={i} className="nav-section-title">{item.section}</div>
          ) : (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <i className={`bi ${item.icon}`}></i>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="nav-link w-100 text-start"
          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
          title={collapsed ? 'Logout' : ''}
        >
          <i className="bi bi-box-arrow-right"></i>
          {!collapsed && <span>Logout</span>}
        </button>
      </nav>

      {!collapsed && (
        <div style={{ padding: '0.75rem 1.25rem 1rem', borderTop: '1px solid var(--border)' }}>
          <SandipLogo size={26} full />
          <div style={{ fontSize: '0.65rem', opacity: 0.35, marginTop: 6 }}>Admin Panel © 2026</div>
        </div>
      )}
    </aside>
  )
}
