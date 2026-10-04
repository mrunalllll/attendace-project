// ─────────────────────────────────────────────
//  EventDetailPage — /events/:slug
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import VoterNavbar from '../../components/VoterNavbar'
import Spinner from '../../components/Spinner'
import { eventsAPI } from '../../services/api'

const CAT_COLORS = {
  Freshers:'#06b6d4', Farewell:'#7c3aed', Workshop:'#f59e0b',
  Seminar:'#3b82f6', Hackathon:'#ef4444', Technical:'#10b981',
  Cultural:'#f97316', Sports:'#84cc16', Fest:'#ec4899', Other:'#6b7280',
}
const STATUS_MAP = { upcoming: { color: '#3b82f6', icon: 'bi-clock-fill' }, ongoing: { color: '#10b981', icon: 'bi-circle-fill' }, completed: { color: '#f59e0b', icon: 'bi-check-circle-fill' }, cancelled: { color: '#ef4444', icon: 'bi-x-circle-fill' } }

function Lightbox({ images, idx, onClose, onPrev, onNext }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') onPrev(); if (e.key === 'ArrowRight') onNext() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  if (idx === null) return null
  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <img src={`/uploads/${images[idx]?.photo}`} className="lightbox-img" alt="" onClick={e => e.stopPropagation()} />
      {images.length > 1 && <>
        <button className="lightbox-btn prev" onClick={e => { e.stopPropagation(); onPrev() }}><i className="bi bi-chevron-left"></i></button>
        <button className="lightbox-btn next" onClick={e => { e.stopPropagation(); onNext() }}><i className="bi bi-chevron-right"></i></button>
      </>}
      <button className="lightbox-close" onClick={onClose}><i className="bi bi-x-lg"></i></button>
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textAlign: 'center' }}>
        {idx + 1} / {images.length}
        {images[idx]?.title && <span style={{ marginLeft: 10 }}>— {images[idx].title}</span>}
      </div>
    </div>
  )
}

export default function EventDetailPage() {
  const { slug } = useParams()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [lbIdx, setLbIdx]     = useState(null)

  useEffect(() => {
    eventsAPI.getBySlug(slug)
      .then(r => setData(r.data))
      .catch(() => setError('Event not found'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }}><VoterNavbar /><div style={{ paddingTop: 100 }}><Spinner /></div></div>
  if (error || !data?.event) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <VoterNavbar />
      <div style={{ paddingTop: 120, textAlign: 'center' }}>
        <i className="bi bi-calendar-x" style={{ fontSize: 64, opacity: 0.3 }}></i>
        <h3 style={{ marginTop: 16, opacity: 0.6 }}>Event not found</h3>
        <Link to="/events" className="btn-gradient px-4 py-2 rounded-3 mt-4 d-inline-flex">← All Events</Link>
      </div>
    </div>
  )

  const { event: ev, photos = [], related = [] } = data
  const statusStyle = STATUS_MAP[ev.status] || STATUS_MAP.upcoming

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <VoterNavbar />
      <div style={{ paddingTop: 70 }}>

        {/* Hero poster */}
        <div style={{ height: 380, position: 'relative', background: `linear-gradient(135deg,${CAT_COLORS[ev.category] || '#4f46e5'},#7c3aed)`, overflow: 'hidden' }}>
          {ev.poster && <img src={`/uploads/${ev.poster}`} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 55%)' }}></div>

          {/* Back */}
          <div style={{ position: 'absolute', top: 16, left: 16 }}>
            <Link to="/events" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-arrow-left"></i> Events
            </Link>
          </div>

          {/* Info */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem 2rem' }}>
            <div className="d-flex flex-wrap gap-2 mb-2">
              <span style={{ background: CAT_COLORS[ev.category] || '#6b7280', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                {ev.category}
              </span>
              <span style={{ background: `${statusStyle.color}cc`, color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                <i className={`bi ${statusStyle.icon} me-1`}></i>{ev.status}
              </span>
              {ev.dept_name && (
                <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem' }}>
                  <i className="bi bi-building me-1"></i>{ev.dept_name}
                </span>
              )}
            </div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2.2rem)', margin: 0, lineHeight: 1.2, maxWidth: 700 }}>{ev.title}</h1>
          </div>
        </div>

        <div className="container-fluid" style={{ maxWidth: 1140, padding: '2rem 1.5rem' }}>
          <div className="row g-4">
            {/* Main content */}
            <div className="col-lg-8">
              {/* Event details card */}
              <div className="glass-card p-4 mb-4">
                <div className="row g-3 mb-4">
                  {[
                    ev.event_date && { icon: 'bi-calendar3', label: 'Date', value: new Date(ev.event_date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' }), color: '#4f46e5' },
                    (ev.start_time || ev.end_time) && { icon: 'bi-clock-fill', label: 'Time', value: [ev.start_time, ev.end_time].filter(Boolean).join(' – '), color: '#7c3aed' },
                    ev.venue && { icon: 'bi-geo-alt-fill', label: 'Venue', value: ev.venue, color: '#06b6d4' },
                    ev.organizer && { icon: 'bi-person-fill', label: 'Organizer', value: ev.organizer, color: '#10b981' },
                  ].filter(Boolean).map(info => (
                    <div key={info.label} className="col-sm-6">
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${info.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`bi ${info.icon}`} style={{ color: info.color, fontSize: 16 }}></i>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{info.label}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', marginTop: 2 }}>{info.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {ev.description && (
                  <>
                    <h6 className="fw-bold text-gradient mb-2">About This Event</h6>
                    <p style={{ lineHeight: 1.8, opacity: 0.85 }}>{ev.description}</p>
                  </>
                )}
              </div>

              {/* Registration */}
              {ev.registration_info && (
                <div className="glass-card p-4 mb-4" style={{ borderLeft: '4px solid var(--success)' }}>
                  <h6 className="fw-bold mb-2"><i className="bi bi-pencil-square me-2" style={{ color: 'var(--success)' }}></i>Registration Info</h6>
                  <p style={{ opacity: 0.85, lineHeight: 1.7, margin: 0 }}>{ev.registration_info}</p>
                </div>
              )}

              {/* Photo gallery */}
              {photos.length > 0 && (
                <div className="glass-card p-4">
                  <h6 className="fw-bold text-gradient mb-3">
                    <i className="bi bi-images me-2"></i>Event Gallery ({photos.length})
                  </h6>
                  <div className="photo-grid">
                    {photos.map((p, i) => (
                      <div key={p.id} className="photo-grid-item" onClick={() => setLbIdx(i)}>
                        <img src={`/uploads/${p.photo}`} alt={p.title || ''} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              {/* Quick info */}
              <div className="glass-card p-4 mb-4">
                <h6 className="fw-bold text-gradient mb-3">Event Info</h6>
                <div className="d-flex flex-column gap-2">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ opacity: 0.55 }}>Status</span>
                    <span style={{ fontWeight: 600, color: statusStyle.color }}>{ev.status?.charAt(0).toUpperCase() + ev.status?.slice(1)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ opacity: 0.55 }}>Category</span>
                    <span style={{ fontWeight: 600 }}>{ev.category}</span>
                  </div>
                  {ev.dept_name && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ opacity: 0.55 }}>Department</span>
                      <Link to={`/departments/${ev.dept_slug}`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>{ev.dept_name}</Link>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '8px 0' }}>
                    <span style={{ opacity: 0.55 }}>Photos</span>
                    <span style={{ fontWeight: 600 }}>{photos.length}</span>
                  </div>
                </div>
              </div>

              {/* Related events */}
              {related.length > 0 && (
                <div className="glass-card p-4">
                  <h6 className="fw-bold text-gradient mb-3">Related Events</h6>
                  <div className="d-flex flex-column gap-3">
                    {related.map(r => (
                      <Link key={r.id} to={`/events/${r.slug}`} className="d-flex gap-3 align-items-start text-decoration-none" style={{ color: 'var(--text)' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: `linear-gradient(135deg,${CAT_COLORS[r.category] || '#4f46e5'},#7c3aed)` }}>
                          {r.poster && <img src={`/uploads/${r.poster}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>{r.title}</div>
                          {r.event_date && <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 2 }}>{new Date(r.event_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Lightbox images={photos} idx={lbIdx} onClose={() => setLbIdx(null)}
        onPrev={() => setLbIdx(i => (i - 1 + photos.length) % photos.length)}
        onNext={() => setLbIdx(i => (i + 1) % photos.length)} />
    </div>
  )
}
