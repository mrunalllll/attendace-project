// ─────────────────────────────────────────────
//  DepartmentDetailPage — /departments/:slug
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import VoterNavbar from '../../components/VoterNavbar'
import Spinner from '../../components/Spinner'
import { departmentsAPI } from '../../services/api'

const TABS = ['About','Faculty','Events','Gallery','Announcements']
const TYPE_COLORS = { info:'#3b82f6', success:'#10b981', warning:'#f59e0b', danger:'#ef4444' }

// Simple lightbox hook
function useLightbox(images) {
  const [idx, setIdx] = useState(null)
  const open  = (i) => setIdx(i)
  const close = () => setIdx(null)
  const prev  = () => setIdx(i => (i - 1 + images.length) % images.length)
  const next  = () => setIdx(i => (i + 1) % images.length)
  useEffect(() => {
    const handler = (e) => {
      if (idx === null) return
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idx])
  return { idx, open, close, prev, next }
}

export default function DepartmentDetailPage() {
  const { slug } = useParams()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('About')
  const [error, setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    departmentsAPI.getBySlug(slug)
      .then(r => setData(r.data))
      .catch(() => setError('Department not found'))
      .finally(() => setLoading(false))
  }, [slug])

  const lb = useLightbox(data?.gallery || [])

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }}><VoterNavbar /><div style={{ paddingTop: 100 }}><Spinner /></div></div>
  if (error || !data?.department) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <VoterNavbar />
      <div style={{ paddingTop: 120, textAlign: 'center' }}>
        <i className="bi bi-building-x" style={{ fontSize: 64, opacity: 0.3 }}></i>
        <h3 style={{ marginTop: 16, opacity: 0.6 }}>Department not found</h3>
        <Link to="/departments" className="btn-gradient px-4 py-2 rounded-3 mt-4 d-inline-flex">← All Departments</Link>
      </div>
    </div>
  )

  const { department: dept, faculty = [], events = [], gallery = [], announcements = [] } = data

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <VoterNavbar />
      <div style={{ paddingTop: 70 }}>

        {/* Banner */}
        <div style={{ position: 'relative', height: 280, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', overflow: 'hidden' }}>
          {dept.banner
            ? <img src={`/uploads/${dept.banner}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
            : dept.image
              ? <img src={`/uploads/${dept.image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
              : null}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 60%)' }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '4px 12px', color: '#fff', fontSize: '0.75rem', fontWeight: 700, marginBottom: 8 }}>
                  {dept.code}
                </div>
                <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2rem)', margin: 0, lineHeight: 1.2 }}>{dept.name}</h1>
                {dept.hod_name && (
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                    <i className="bi bi-person-fill me-1"></i>HOD: {dept.hod_name}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', top: 16, left: 16 }}>
            <Link to="/departments" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-arrow-left"></i> Departments
            </Link>
          </div>
        </div>

        <div className="container-fluid" style={{ maxWidth: 1280, padding: '0 1.5rem 3rem' }}>
          {/* Quick stats */}
          <div className="row g-3 my-3">
            {[
              { icon: 'bi-calendar-event-fill', color: '#4f46e5', val: events.length,       label: 'Events' },
              { icon: 'bi-people-fill',          color: '#7c3aed', val: faculty.length,      label: 'Faculty' },
              { icon: 'bi-images',               color: '#06b6d4', val: gallery.length,      label: 'Gallery' },
              { icon: 'bi-megaphone-fill',        color: '#10b981', val: announcements.length, label: 'Notices' },
              dept.seats ? { icon: 'bi-mortarboard-fill', color: '#f59e0b', val: dept.seats, label: 'Seats' } : null,
              dept.established ? { icon: 'bi-clock-history', color: '#ef4444', val: dept.established, label: 'Est.' } : null,
            ].filter(Boolean).map(s => (
              <div key={s.label} className="col-4 col-md-2">
                <div className="glass-card p-3 text-center" style={{ border: `1px solid ${s.color}33` }}>
                  <i className={`bi ${s.icon}`} style={{ fontSize: 22, color: s.color }}></i>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: 4 }}>{s.val}</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.55 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="dept-tab-bar">
            {TABS.map(t => (
              <button key={t} className={`dept-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'About' && (
            <div className="row g-4">
              <div className="col-md-8">
                <div className="glass-card p-4">
                  <h5 className="fw-bold mb-3 text-gradient">About {dept.name}</h5>
                  <p style={{ lineHeight: 1.8, opacity: 0.85 }}>{dept.description || 'No description available.'}</p>
                  {dept.established && <p style={{ opacity: 0.6, fontSize: '0.85rem', marginTop: 16 }}><i className="bi bi-clock-history me-2"></i>Established: {dept.established}</p>}
                  {dept.seats && <p style={{ opacity: 0.6, fontSize: '0.85rem' }}><i className="bi bi-mortarboard me-2"></i>Total Seats: {dept.seats}</p>}
                </div>
              </div>
              {dept.hod_name && (
                <div className="col-md-4">
                  <div className="glass-card p-4 text-center">
                    {dept.hod_photo
                      ? <img src={`/uploads/${dept.hod_photo}`} alt="" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', marginBottom: 12 }} />
                      : <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                          <i className="bi bi-person-fill text-white" style={{ fontSize: 38 }}></i>
                        </div>}
                    <h6 className="fw-bold mb-1">{dept.hod_name}</h6>
                    <p style={{ fontSize: '0.8rem', opacity: 0.55 }}>Head of Department</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'Faculty' && (
            <div className="row g-3">
              {faculty.length === 0
                ? <div className="col-12 text-center py-5" style={{ opacity: 0.4 }}><i className="bi bi-people fs-1 d-block mb-2"></i><p>No faculty listed yet</p></div>
                : faculty.map(f => (
                  <div key={f.id} className="col-sm-6 col-md-4 col-lg-3">
                    <div className="glass-card p-4 text-center hover-lift">
                      {f.photo
                        ? <img src={`/uploads/${f.photo}`} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', marginBottom: 10 }} />
                        : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                            <i className="bi bi-person-fill text-white" style={{ fontSize: 28 }}></i>
                          </div>}
                      <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{f.name}</div>
                      {f.designation && <div style={{ fontSize: '0.75rem', opacity: 0.55 }}>{f.designation}</div>}
                      {f.email && <div style={{ fontSize: '0.72rem', opacity: 0.45, marginTop: 4 }}>{f.email}</div>}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === 'Events' && (
            <div className="row g-3">
              {events.length === 0
                ? <div className="col-12 text-center py-5" style={{ opacity: 0.4 }}><i className="bi bi-calendar-x fs-1 d-block mb-2"></i><p>No events yet</p></div>
                : events.map(ev => (
                  <div key={ev.id} className="col-sm-6 col-lg-4">
                    <Link to={`/events/${ev.slug}`} className="event-card text-decoration-none hover-lift">
                      <div style={{ height: 160, background: 'linear-gradient(135deg,var(--primary),var(--secondary))', overflow: 'hidden', flexShrink: 0 }}>
                        {ev.poster && <img src={`/uploads/${ev.poster}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div style={{ padding: '1rem' }}>
                        <div className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>{ev.title}</div>
                        {ev.event_date && <div style={{ fontSize: '0.78rem', opacity: 0.55 }}><i className="bi bi-calendar3 me-1"></i>{new Date(ev.event_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>}
                        {ev.venue && <div style={{ fontSize: '0.78rem', opacity: 0.55 }}><i className="bi bi-geo-alt me-1"></i>{ev.venue}</div>}
                      </div>
                    </Link>
                  </div>
                ))}
            </div>
          )}

          {tab === 'Gallery' && (
            <>
              <div className="photo-grid">
                {gallery.length === 0
                  ? <p style={{ opacity: 0.4 }}>No gallery photos yet</p>
                  : gallery.map((img, i) => (
                    <div key={img.id} className="gallery-item" onClick={() => lb.open(i)}>
                      <img src={`/uploads/${img.photo}`} alt={img.title || ''} />
                      <div className="gallery-overlay">
                        {img.title && <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{img.title}</span>}
                      </div>
                    </div>
                  ))}
              </div>
              {/* Lightbox */}
              {lb.idx !== null && (
                <div className="lightbox-backdrop" onClick={lb.close}>
                  <img src={`/uploads/${gallery[lb.idx]?.photo}`} className="lightbox-img" alt="" onClick={e => e.stopPropagation()} />
                  <button className="lightbox-btn prev" onClick={e => { e.stopPropagation(); lb.prev() }}><i className="bi bi-chevron-left"></i></button>
                  <button className="lightbox-btn next" onClick={e => { e.stopPropagation(); lb.next() }}><i className="bi bi-chevron-right"></i></button>
                  <button className="lightbox-close" onClick={lb.close}><i className="bi bi-x-lg"></i></button>
                  <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                    {lb.idx + 1} / {gallery.length}
                    {gallery[lb.idx]?.title && <span style={{ marginLeft: 12 }}>— {gallery[lb.idx].title}</span>}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'Announcements' && (
            <div className="d-flex flex-column gap-3">
              {announcements.length === 0
                ? <div className="text-center py-5" style={{ opacity: 0.4 }}><i className="bi bi-megaphone fs-1 d-block mb-2"></i><p>No announcements</p></div>
                : announcements.map(a => (
                  <div key={a.id} className={`ann-banner ${a.type}`}>
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        {a.is_pinned === 1 && <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.6, marginBottom: 2, display: 'block' }}>📌 PINNED</span>}
                        <div className="fw-semibold">{a.title}</div>
                        {a.body && <p style={{ fontSize: '0.85rem', opacity: 0.75, margin: '4px 0 0' }}>{a.body}</p>}
                      </div>
                      <span style={{ fontSize: '0.72rem', opacity: 0.5, whiteSpace: 'nowrap' }}>
                        {new Date(a.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
