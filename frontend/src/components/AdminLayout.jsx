// ─────────────────────────────────────────────
//  AdminLayout — wraps every admin page
//  Usage:
//    <AdminLayout breadcrumb="Dashboard">
//      <YourPageContent />
//    </AdminLayout>
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminNavbar  from './AdminNavbar'

export default function AdminLayout({ children, breadcrumb = '' }) {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = () => window.innerWidth < 992

  // Restore sidebar state from localStorage
  useEffect(() => {
    if (localStorage.getItem('vs_sidebar') === '1') setCollapsed(true)
  }, [])

  function toggleSidebar() {
    if (isMobile()) {
      setMobileOpen(o => !o)
    } else {
      setCollapsed(c => {
        localStorage.setItem('vs_sidebar', !c ? '1' : '0')
        return !c
      })
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Blobs */}
      <div className="blob blob-1" style={{ opacity: 0.04 }} />
      <div className="blob blob-2" style={{ opacity: 0.04 }} />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay active" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={isMobile() && mobileOpen ? 'mobile-open' : ''}>
        <AdminSidebar collapsed={collapsed} />
      </div>

      {/* Main content */}
      <div
        className={`main-content ${collapsed ? 'expanded' : ''}`}
        style={{ paddingTop: 0 }}
      >
        <AdminNavbar onToggleSidebar={toggleSidebar} breadcrumb={breadcrumb} />
        <div style={{ padding: '0 0.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
