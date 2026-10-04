// ─────────────────────────────────────────────
//  EventsPage — public events list with filters
//  Route: /events
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import VoterNavbar from '../../components/VoterNavbar'
import Spinner from '../../components/Spinner'
import { eventsAPI, departmentsAPI } from '../../services/api'

const CATEGORIES = ['All','Freshers','Farewell','Workshop','Seminar','Hackathon','Technical','Cultural','Sports','Fest','Other']
const STATUSES   = [
  { value: '', label: 'All Events' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
]
const CAT_COLORS = {
  Freshers:'#06b6d4', Farewell:'#7c3aed', Workshop:'#f59e0b',
  Seminar:'#3b82f6', Hackathon:'#ef4444', Technical:'#10b981',
  Cultural:'#f97316', Sports:'#84cc16', Fest:'#ec4899', Other:'#6b7280',
}
const STATUS_COLORS = { upcoming:'#3b82f6', ongoing:'#10b981', completed:'#f59e0b', cancelled:'#ef4444' }

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents]           = useState([])
  const [departments, setDepts]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(1)

  const [search, setSearch]   = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [status, setStatus]   = useState(searchParams.get('status') || '')
  const [dept, setDept]       = useState(searchParams.get('dept') || '')

  const LIMIT = 12

  useEffect(() => {
    departmentsAPI.getAll().then(r => setDepts(r.data.departments || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    eventsAPI.getAll({ search, category: category === 'All' ? '' : category, status, dept, page, limit: LIMIT })
      .then(r => { setEvents(r.data.events || []); setTotal(r.data.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, category, status, dept, page])

  const totalPages = Math.ceil(total / LIMIT)

  const resetFilters = () => { setSearch(''); setCategory(''); setStatus(''); setDept(''); setPage(1) }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <VoterNavbar />
      <div style={{ paddingTop: 70 }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5,#06b6d4)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', width: 60, height: 60, background: 'rgba(255,255,255,0.2)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <i className="bi bi-calendar-event-fill text-white" style={{ fontSize: 26 }}></i>
          </div>
          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.5rem,4vw,2.2rem)', marginBottom: 8 }}>College Events</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 0 }}>Workshops, Hackathons, Cultural Fests and more</p>
        </div>

        <div className="container-fluid" style={{ maxWidth: 1280, padding: '2rem 1.5rem' }}>
          {/* Filters */}
          <div className="glass-card p-3 mb-4">
            <div className="row g-2 align-items-end">
              <div className="col-md-4">
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}></i>
                  <input className="form-control-glass" style={{ paddingLeft: 38 }}
                    placeholder="Search events..." value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>
              </div>
              <div className="col-md-3">
                <select className="form-select-glass" value={dept} onChange={e => { setDept(e.target.value); setPage(1) }}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <select className="form-select-glass" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <button className="btn-glass w-100 py-2 rounded-2" onClick={resetFilters}>
                  <i className="bi bi-x-circle me-1"></i>Reset
                </button>
              </div>
            </div>

            {/* Category chips */}
            <div className="d-flex gap-2 flex-wrap mt-3">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => { setCategory(c === 'All' ? '' : c); setPage(1) }}
                  className={`filter-chip ${(c === 'All' ? !category : category === c) ? 'active' : ''}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <p style={{ opacity: 0.5, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {total} event{total !== 1 ? 's' : ''} found
          </p>

          {loading ? <Spinner message="Loading events..." /> : (
            <>
              <div className="row g-4">
                {events.length === 0 ? (
                  <div className="col-12 text-center py-5" style={{ opacity: 0.4 }}>
                    <i className="bi bi-calendar-x fs-1 d-block mb-3"></i>
                    <p>No events found. Try different filters.</p>
                  </div>
                ) : events.map(ev => (
                  <div key={ev.id} className="col-sm-6 col-lg-4 col-xl-3">
                    <Link to={`/events/${ev.slug}`} className="event-card hover-lift text-decoration-none d-flex flex-column h-100">
                      {/* Poster */}
                      <div style={{ height: 200, position: 'relative', background: `linear-gradient(135deg,${CAT_COLORS[ev.category] || '#4f46e5'},#7c3aed)`, overflow: 'hidden', flexShrink: 0 }}>
                        {ev.poster && <img src={`/uploads/${ev.poster}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        {/* Category */}
                        <div style={{ position: 'absolute', top: 10, left: 10, background: CAT_COLORS[ev.category] || '#6b7280', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>
                          {ev.category}
                        </div>
                        {/* Status */}
                        <div style={{ position: 'absolute', top: 10, right: 10, background: `${STATUS_COLORS[ev.status] || '#6b7280'}dd`, color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>
                          {ev.status}
                        </div>
                        {/* Photo count */}
                        {ev.photo_count > 0 && (
                          <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', backdropFilter: 'blur(4px)' }}>
                            <i className="bi bi-images me-1"></i>{ev.photo_count}
                          </div>
                        )}
                      </div>

                      {/* Body */}
                      <div style={{ padding: '1rem 1.1rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <h6 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {ev.title}
                        </h6>
                        {ev.dept_name && <p style={{ fontSize: '0.76rem', opacity: 0.55, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}><i className="bi bi-building" style={{ fontSize: 11 }}></i>{ev.dept_name}</p>}
                        {ev.event_date && <p style={{ fontSize: '0.76rem', opacity: 0.55, margin: '0 0 4px' }}><i className="bi bi-calendar3 me-1"></i>{new Date(ev.event_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>}
                        {ev.venue && <p style={{ fontSize: '0.76rem', opacity: 0.55, margin: 0 }}><i className="bi bi-geo-alt me-1"></i>{ev.venue}</p>}
                        <div style={{ marginTop: 'auto', paddingTop: 10, color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          View Details <i className="bi bi-arrow-right" style={{ fontSize: 11 }}></i>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center gap-2 mt-4 flex-wrap">
                  <button className="btn-glass px-3 py-2 rounded-2" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={page === i + 1 ? 'btn-gradient px-3 py-2 rounded-2' : 'btn-glass px-3 py-2 rounded-2'}>
                      {i + 1}
                    </button>
                  ))}
                  <button className="btn-glass px-3 py-2 rounded-2" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
