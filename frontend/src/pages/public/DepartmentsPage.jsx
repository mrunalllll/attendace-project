// ─────────────────────────────────────────────
//  DepartmentsPage — public grid of all departments
//  Route: /departments
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import VoterNavbar from '../../components/VoterNavbar'
import Spinner from '../../components/Spinner'
import { departmentsAPI } from '../../services/api'

export default function DepartmentsPage() {
  const [departments, setDepts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    departmentsAPI.getAll()
      .then(r => setDepts(r.data.departments || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code || '').toLowerCase().includes(search.toLowerCase())
  )

  const DEPT_GRADIENTS = [
    'linear-gradient(135deg,#4f46e5,#7c3aed)',
    'linear-gradient(135deg,#06b6d4,#3b82f6)',
    'linear-gradient(135deg,#10b981,#059669)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#ec4899,#8b5cf6)',
    'linear-gradient(135deg,#14b8a6,#06b6d4)',
    'linear-gradient(135deg,#f97316,#ef4444)',
    'linear-gradient(135deg,#84cc16,#10b981)',
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <VoterNavbar />
      <div style={{ paddingTop: 80 }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#06b6d4 100%)',
          padding: '3rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute', borderRadius: '50%', background: '#fff',
                width: 200 + i * 50, height: 200 + i * 50,
                top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
                filter: 'blur(60px)', opacity: 0.15,
              }} />
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'rgba(255,255,255,0.2)', borderRadius: 18, marginBottom: 16, backdropFilter: 'blur(8px)' }}>
              <i className="bi bi-building-fill text-white" style={{ fontSize: 28 }}></i>
            </div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.5rem)', marginBottom: 8 }}>
              Our Departments
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', maxWidth: 500, margin: '0 auto 1.5rem' }}>
              Explore Sandip University's diverse academic departments and programs
            </p>
            <div style={{ maxWidth: 440, margin: '0 auto', position: 'relative' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: 16 }}></i>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search departments..."
                style={{
                  width: '100%', padding: '12px 16px 12px 44px', borderRadius: 50,
                  border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: '0.9rem', backdropFilter: 'blur(8px)',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        <div className="container-fluid" style={{ maxWidth: 1280, padding: '2.5rem 1.5rem' }}>
          {loading ? <Spinner message="Loading departments..." /> : (
            <>
              <p style={{ opacity: 0.5, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                {filtered.length} department{filtered.length !== 1 ? 's' : ''} found
              </p>

              <div className="row g-4">
                {filtered.length === 0 ? (
                  <div className="col-12 text-center py-5" style={{ opacity: 0.4 }}>
                    <i className="bi bi-building fs-1 d-block mb-3"></i>
                    <p>No departments found</p>
                  </div>
                ) : filtered.map((dept, i) => (
                  <div key={dept.id} className="col-sm-6 col-lg-4 col-xl-3">
                    <Link to={`/departments/${dept.slug}`} className="dept-card d-block hover-lift text-decoration-none">
                      {/* Image / Gradient top */}
                      <div style={{ height: 160, position: 'relative', overflow: 'hidden', background: DEPT_GRADIENTS[i % DEPT_GRADIENTS.length] }}>
                        {dept.image
                          ? <img src={`/uploads/${dept.image}`} alt={dept.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              <i className="bi bi-building text-white" style={{ fontSize: 52, opacity: 0.4 }}></i>
                            </div>}
                        {/* Code badge */}
                        {dept.code && (
                          <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '4px 10px', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                            {dept.code}
                          </div>
                        )}
                        {/* Stats overlay */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.7),transparent)', padding: '20px 12px 8px', display: 'flex', gap: 12 }}>
                          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem' }}>
                            <i className="bi bi-calendar-event me-1"></i>{dept.event_count || 0} events
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem' }}>
                            <i className="bi bi-people me-1"></i>{dept.faculty_count || 0} faculty
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
                        <h6 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, lineHeight: 1.3 }}>{dept.name}</h6>
                        {dept.hod_name && (
                          <p style={{ fontSize: '0.78rem', opacity: 0.55, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="bi bi-person-fill" style={{ fontSize: 12 }}></i>HOD: {dept.hod_name}
                          </p>
                        )}
                        {dept.description && (
                          <p style={{ fontSize: '0.8rem', opacity: 0.65, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {dept.description}
                          </p>
                        )}
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                          Explore Department <i className="bi bi-arrow-right" style={{ fontSize: 12 }}></i>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
