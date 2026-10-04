// ─────────────────────────────────────────────
//  VoterNavbar — top bar for voter / public pages
//  Props: none (reads from AuthContext)
// ─────────────────────────────────────────────
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import SandipLogo from './SandipLogo'
import { useState } from 'react'

export default function VoterNavbar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { to: '/voter/dashboard',    icon: 'bi-house-fill',           label: 'Home' },
    { to: '/events',             icon: 'bi-calendar-event-fill',  label: 'Events' },
    { to: '/gallery',            icon: 'bi-images',               label: 'Gallery' },
    { to: '/search',             icon: 'bi-search',               label: 'Search' },
  ]

  return (
    <>
      <nav className="navbar-glass" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1030, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: 64 }}>
        {/* Brand */}
        <Link to="/voter/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <SandipLogo size={38} full className="d-none d-md-flex" />
          <SandipLogo size={36} className="d-md-none" />
        </Link>

        {/* Desktop nav links */}
        <div className="d-none d-lg-flex align-items-center gap-1">
          {navLinks.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => `voter-nav-link ${isActive ? 'active' : ''}`}>
              <i className={`bi ${l.icon}`} style={{ fontSize: 13 }}></i>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ThemeToggle />

          {/* Avatar dropdown */}
          {user && (
            <div className="dropdown">
              <div data-bs-toggle="dropdown"
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                <img
                  src={user?.photo ? `/uploads/${user.photo}` : '/uploads/default.png'}
                  className="avatar" alt="profile"
                  style={{ width: 34, height: 34 }}
                />
                <span style={{ fontSize: '0.83rem', fontWeight: 600 }} className="d-none d-md-inline">
                  {user?.name}
                </span>
                <i className="bi bi-chevron-down" style={{ fontSize: '0.65rem', opacity: 0.5 }} />
              </div>
              <ul className="dropdown-menu dropdown-menu-end glass-card border-0" style={{ minWidth: 180 }}>
                <li><Link className="dropdown-item" to="/voter/dashboard"><i className="bi bi-house me-2"></i>Dashboard</Link></li>
                <li><hr className="dropdown-divider" style={{ borderColor: 'var(--border)' }} /></li>
                <li>
                  <button className="dropdown-item" onClick={logout} style={{ color: 'var(--danger)' }}>
                    <i className="bi bi-box-arrow-right me-2" /> Logout
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Mobile hamburger */}
          <button className="d-lg-none btn-glass px-2 py-1 rounded-2" style={{ fontSize: 18 }}
            onClick={() => setMobileOpen(o => !o)}>
            <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 1029,
          background: 'var(--navbar-bg)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)', padding: '0.75rem 1.5rem 1rem',
        }}>
          {navLinks.map(l => (
            <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `voter-nav-link d-flex mb-1 ${isActive ? 'active' : ''}`}>
              <i className={`bi ${l.icon} me-2`}></i>
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </>
  )
}
