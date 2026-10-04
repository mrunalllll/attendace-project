// ─────────────────────────────────────────────
//  SearchPage — unified search across events,
//               departments, gallery, announcements
//  Route: /search?q=...&type=...
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import VoterNavbar from '../../components/VoterNavbar'
import Spinner from '../../components/Spinner'
import { eventsAPI, departmentsAPI, galleryAPI, announcementsAPI } from '../../services/api'

const TYPES = [
  { value: 'all',           label: 'All',           icon: 'bi-search' },
  { value: 'events',        label: 'Events',         icon: 'bi-calendar-event-fill' },
  { value: 'departments',   label: 'Departments',    icon: 'bi-building-fill' },
  { value: 'gallery',       label: 'Gallery',        icon: 'bi-images' },
  { value: 'announcements', label: 'Announcements',  icon: 'bi-megaphone-fill' },
]

const CAT_COLORS = { Freshers:'#06b6d4', Farewell:'#7c3aed', Workshop:'#f59e0b', Seminar:'#3b82f6', Hackathon:'#ef4444', Technical:'#10b981', Cultural:'#f97316', Sports:'#84cc16', Fest:'#ec4899', Other:'#6b7280' }
const TYPE_COLORS = { info:'#3b82f6', success:'#10b981', warning:'#f59e0b', danger:'#ef4444' }

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery]     = useState(searchParams.get('q') || '')
  const [type, setType]       = useState(searchParams.get('type') || 'all')
  const [loading, setLoading] = useState(false)

  const [events,        setEvents]   = useState([])
  const [departments,   setDepts]    = useState([])
  const [gallery,       setGallery]  = useState([])
  const [announcements, setAnn]      = useState([])

  const [lbImg, setLbImg] = useState(null)
  const inputRef = useRef()

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!query.trim()) {
      setEvents([]); setDepts([]); setGallery([]); setAnn([])
      return
    }
    setLoading(true)
    setSearchParams({ q: query, type })

    const search = query.trim()

    Promise.all([
      (type === 'all' || type === 'events')        ? eventsAPI.getAll({ search, limit: 12 })               : Promise.resolve({ data: { events: [] } }),
      (type === 'all' || type === 'departments')    ? departmentsAPI.getAll()                               : Promise.resolve({ data: { departments: [] } }),
      (type === 'all' || type === 'gallery')        ? galleryAPI.getAll({ search, limit: 12 })              : Promise.resolve({ data: { images: [] } }),
      (type === 'all' || type === 'announcements')  ? announcementsAPI.getAll({ search, limit: 12 })        : Promise.resolve({ data: { announcements: [] } }),
    ]).then(([evRes, deptRes, gallRes, annRes]) => {
      const q = search.toLowerCase()
      setEvents(evRes.data.events || [])
      // Filter departments client-side since no search param on getAll
      setDepts((deptRes.data.departments || []).filter(d =>
        d.name.toLowerCase().includes(q) || (d.code || '').toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)
      ))
      setGallery(gallRes.data.images || [])
      setAnn(annRes.data.announcements || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [query, type])

  const totalResults = events.length + departments.length + gallery.length + announcements.length
  const hasResults   = totalResults > 0
  const hasQuery     = query.trim().length > 0

  const DEPT_GRADIENTS = ['linear-gradient(135deg,#4f46e5,#7c3aed)','linear-gradient(135deg,#06b6d4,#3b82f6)','linear-gradient(135deg,#10b981,#059669)','linear-gradient(135deg,#f59e0b,#ef4444)','linear-gradient(135deg,#ec4899,#8b5cf6)','linear-gradient(135deg,#14b8a6,#06b6d4)','linear-gradient(135deg,#f97316,#ef4444)','linear-gradient(135deg,#84cc16,#10b981)']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <VoterNavbar />
      <div style={{ paddingTop: 70 }}>

        {/* Search header */}
        <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#4f46e5,#7c3aed)', padding: '2.5rem 1.5rem' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ color: '#fff', fontWeight: 800, marginBottom: 20 }}>
              <i className="bi bi-search me-2"></i>Search
            </h2>
            {/* Big search bar */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: 18 }}></i>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search events, departments, gallery, announcements..."
                style={{
                  width: '100%', padding: '16px 20px 16px 52px',
                  borderRadius: 50, border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.12)', color: '#fff',
                  fontSize: '1rem', backdropFilter: 'blur(8px)', outline: 'none',
                }}
              />
              {query && (
                <button onClick={() => setQuery('')}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', fontSize: 14 }}>
                  ✕
                </button>
              )}
            </div>
            {/* Type filter chips */}
            <div className="d-flex gap-2 flex-wrap justify-content-center">
              {TYPES.map(t => (
                <button key={t.value} onClick={() => setType(t.value)}
                  style={{
                    padding: '6px 18px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: type === t.value ? '#fff' : 'rgba(255,255,255,0.15)',
                    color: type === t.value ? '#4f46e5' : '#fff',
                    backdropFilter: 'blur(8px)', transition: 'all 0.2s',
                  }}>
                  <i className={`bi ${t.icon} me-1`}></i>{t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container-fluid" style={{ maxWidth: 1140, padding: '2rem 1.5rem' }}>

          {!hasQuery && (
            <div className="text-center py-5" style={{ opacity: 0.45 }}>
              <i className="bi bi-search" style={{ fontSize: 64 }}></i>
              <h5 style={{ marginTop: 16, fontWeight: 700 }}>Type to search</h5>
              <p>Search across all events, departments, gallery photos and announcements</p>
            </div>
          )}

          {hasQuery && loading && <Spinner message="Searching..." />}

          {hasQuery && !loading && !hasResults && (
            <div className="text-center py-5" style={{ opacity: 0.45 }}>
              <i className="bi bi-emoji-frown" style={{ fontSize: 64 }}></i>
              <h5 style={{ marginTop: 16, fontWeight: 700 }}>No results found</h5>
              <p>Try different keywords or browse all sections from the menu</p>
            </div>
          )}

          {hasQuery && !loading && hasResults && (
            <>
              <p style={{ opacity: 0.5, fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                <strong>{totalResults}</strong> result{totalResults !== 1 ? 's' : ''} for "<strong>{query}</strong>"
              </p>

              {/* Events results */}
              {events.length > 0 && (
                <section className="mb-5">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-gradient fw-bold mb-0"><i className="bi bi-calendar-event-fill me-2"></i>Events ({events.length})</h6>
                    <Link to={`/events?search=${encodeURIComponent(query)}`} className="btn-glass" style={{ fontSize: '0.78rem', padding: '0.35rem 0.9rem' }}>View All</Link>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {events.slice(0, 6).map(ev => (
                      <Link key={ev.id} to={`/events/${ev.slug}`} className="search-result-item">
                        <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: `linear-gradient(135deg,${CAT_COLORS[ev.category]||'#4f46e5'},#7c3aed)` }}>
                          {ev.poster && <img src={`/uploads/${ev.poster}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ev.title}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.55 }}>
                            {ev.dept_name && <span className="me-3"><i className="bi bi-building me-1"></i>{ev.dept_name}</span>}
                            {ev.event_date && <span className="me-3"><i className="bi bi-calendar3 me-1"></i>{new Date(ev.event_date).toLocaleDateString('en-IN')}</span>}
                            {ev.venue && <span><i className="bi bi-geo-alt me-1"></i>{ev.venue}</span>}
                          </div>
                        </div>
                        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span style={{ background: CAT_COLORS[ev.category]||'#6b7280', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700 }}>{ev.category}</span>
                          <span style={{ fontSize: '0.72rem', opacity: 0.5 }}>{ev.status}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Departments results */}
              {departments.length > 0 && (
                <section className="mb-5">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-gradient fw-bold mb-0"><i className="bi bi-building-fill me-2"></i>Departments ({departments.length})</h6>
                    <Link to="/departments" className="btn-glass" style={{ fontSize: '0.78rem', padding: '0.35rem 0.9rem' }}>View All</Link>
                  </div>
                  <div className="row g-3">
                    {departments.slice(0, 4).map((dept, i) => (
                      <div key={dept.id} className="col-sm-6 col-md-3">
                        <Link to={`/departments/${dept.slug}`} className="glass-card p-3 d-flex align-items-center gap-3 text-decoration-none hover-lift" style={{ color: 'var(--text)' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: DEPT_GRADIENTS[i%DEPT_GRADIENTS.length], overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {dept.image
                              ? <img src={`/uploads/${dept.image}`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                              : <i className="bi bi-building text-white" style={{ fontSize: 18 }}></i>}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dept.name}</div>
                            {dept.code && <div style={{ fontSize: '0.72rem', opacity: 0.5 }}>{dept.code}</div>}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Gallery results */}
              {gallery.length > 0 && (
                <section className="mb-5">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-gradient fw-bold mb-0"><i className="bi bi-images me-2"></i>Gallery ({gallery.length})</h6>
                    <Link to={`/gallery?search=${encodeURIComponent(query)}`} className="btn-glass" style={{ fontSize: '0.78rem', padding: '0.35rem 0.9rem' }}>View All</Link>
                  </div>
                  <div className="row g-2">
                    {gallery.slice(0, 8).map(img => (
                      <div key={img.id} className="col-6 col-md-3 col-lg-2">
                        <div className="photo-grid-item" onClick={() => setLbImg(img)} style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}>
                          <img src={`/uploads/${img.photo}`} alt={img.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        </div>
                        {img.title && <p style={{ fontSize: '0.7rem', opacity: 0.55, margin: '4px 0 0', textAlign: 'center' }}>{img.title}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Announcements results */}
              {announcements.length > 0 && (
                <section className="mb-5">
                  <h6 className="text-gradient fw-bold mb-3"><i className="bi bi-megaphone-fill me-2"></i>Announcements ({announcements.length})</h6>
                  <div className="d-flex flex-column gap-2">
                    {announcements.slice(0, 5).map(a => (
                      <div key={a.id} className={`ann-banner ${a.type}`}>
                        <div className="d-flex justify-content-between">
                          <div>
                            {a.is_pinned === 1 && <span style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.6, marginBottom: 2, display: 'block' }}>📌 PINNED</span>}
                            <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{a.title}</div>
                            {a.body && <p style={{ fontSize: '0.82rem', opacity: 0.7, margin: '4px 0 0' }}>{a.body}</p>}
                            {a.dept_name && <span style={{ fontSize: '0.72rem', opacity: 0.55, marginTop: 4, display: 'block' }}><i className="bi bi-building me-1"></i>{a.dept_name}</span>}
                          </div>
                          <span style={{ fontSize: '0.72rem', opacity: 0.45, whiteSpace: 'nowrap', marginLeft: 12, flexShrink: 0 }}>
                            {new Date(a.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox for gallery */}
      {lbImg && (
        <div className="lightbox-backdrop" onClick={() => setLbImg(null)}>
          <img src={`/uploads/${lbImg.photo}`} className="lightbox-img" alt={lbImg.title || ''} onClick={e => e.stopPropagation()} />
          <button className="lightbox-close" onClick={() => setLbImg(null)}><i className="bi bi-x-lg"></i></button>
          {lbImg.title && (
            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{lbImg.title}</div>
          )}
        </div>
      )}
    </div>
  )
}
