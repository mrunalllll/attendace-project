// ─────────────────────────────────────────────
//  GalleryPage — college gallery with lightbox
//  Route: /gallery
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import VoterNavbar from '../../components/VoterNavbar'
import Spinner from '../../components/Spinner'
import { galleryAPI, departmentsAPI } from '../../services/api'

const CATEGORIES = ['All','Campus','Buildings','Classrooms','Labs','Library','Sports','Auditorium','Events','Students','Faculty','Achievements','General']

export default function GalleryPage() {
  const [images, setImages]       = useState([])
  const [departments, setDepts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)

  const [category, setCategory]   = useState('')
  const [dept, setDept]           = useState('')
  const [search, setSearch]       = useState('')

  // Lightbox
  const [lbIdx, setLbIdx]         = useState(null)

  const LIMIT = 30

  useEffect(() => {
    departmentsAPI.getAll().then(r => setDepts(r.data.departments || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    galleryAPI.getAll({ category: category === 'All' ? '' : category, dept, search, limit: LIMIT, page })
      .then(r => { setImages(r.data.images || []); setTotal(r.data.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category, dept, search, page])

  const totalPages = Math.ceil(total / LIMIT)

  // Keyboard nav
  useEffect(() => {
    const h = (e) => {
      if (lbIdx === null) return
      if (e.key === 'Escape')      setLbIdx(null)
      if (e.key === 'ArrowLeft')   setLbIdx(i => (i - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight')  setLbIdx(i => (i + 1) % images.length)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [lbIdx, images.length])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <VoterNavbar />
      <div style={{ paddingTop: 70 }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,#06b6d4,#4f46e5,#7c3aed)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', width: 60, height: 60, background: 'rgba(255,255,255,0.2)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <i className="bi bi-images text-white" style={{ fontSize: 26 }}></i>
          </div>
          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.5rem,4vw,2.2rem)', marginBottom: 6 }}>College Gallery</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)' }}>Campus life, events, achievements and memories</p>
        </div>

        <div className="container-fluid" style={{ maxWidth: 1400, padding: '2rem 1.5rem' }}>
          {/* Filters */}
          <div className="glass-card p-3 mb-4">
            <div className="row g-2 mb-3">
              <div className="col-md-5">
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.45 }}></i>
                  <input className="form-control-glass" style={{ paddingLeft: 38 }}
                    placeholder="Search photos..." value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>
              </div>
              <div className="col-md-4">
                <select className="form-select-glass" value={dept} onChange={e => { setDept(e.target.value); setPage(1) }}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <button className="btn-glass w-100 py-2 rounded-2" onClick={() => { setSearch(''); setCategory(''); setDept(''); setPage(1) }}>
                  <i className="bi bi-x-circle me-1"></i>Reset Filters
                </button>
              </div>
            </div>
            {/* Category chips */}
            <div className="d-flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => { setCategory(c === 'All' ? '' : c); setPage(1) }}
                  className={`filter-chip ${(c === 'All' ? !category : category === c) ? 'active' : ''}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <p style={{ opacity: 0.5, fontSize: '0.85rem', margin: 0 }}>
              {total} photo{total !== 1 ? 's' : ''}
              {category && ` in ${category}`}
            </p>
          </div>

          {loading ? <Spinner message="Loading gallery..." /> : (
            <>
              {images.length === 0 ? (
                <div className="text-center py-5" style={{ opacity: 0.4 }}>
                  <i className="bi bi-images fs-1 d-block mb-3"></i>
                  <p>No photos found. Try different filters.</p>
                </div>
              ) : (
                <div className="gallery-grid">
                  {images.map((img, i) => (
                    <div key={img.id} className="gallery-item" onClick={() => setLbIdx(i)}>
                      <img src={`/uploads/${img.photo}`} alt={img.title || ''} loading="lazy" />
                      <div className="gallery-overlay">
                        <div>
                          {img.title && <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem', marginBottom: 2 }}>{img.title}</div>}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ background: 'rgba(79,70,229,0.8)', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem' }}>{img.category}</span>
                            {img.dept_name && <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem' }}>{img.dept_name}</span>}
                          </div>
                        </div>
                      </div>
                      {img.is_featured === 1 && (
                        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(245,158,11,0.9)', borderRadius: 20, padding: '2px 7px', fontSize: '0.65rem', color: '#fff', fontWeight: 700 }}>
                          ★
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center gap-2 mt-5 flex-wrap">
                  <button className="btn-glass px-3 py-2 rounded-2" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  {[...Array(Math.min(totalPages, 8))].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={page === i + 1 ? 'btn-gradient px-3 py-2 rounded-2' : 'btn-glass px-3 py-2 rounded-2'}>
                      {i + 1}
                    </button>
                  ))}
                  {totalPages > 8 && <span style={{ padding: '8px', opacity: 0.5 }}>…{totalPages}</span>}
                  <button className="btn-glass px-3 py-2 rounded-2" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lbIdx !== null && (
        <div className="lightbox-backdrop" onClick={() => setLbIdx(null)}>
          <img
            src={`/uploads/${images[lbIdx]?.photo}`}
            className="lightbox-img" alt={images[lbIdx]?.title || ''}
            onClick={e => e.stopPropagation()}
          />
          {images.length > 1 && <>
            <button className="lightbox-btn prev" onClick={e => { e.stopPropagation(); setLbIdx(i => (i - 1 + images.length) % images.length) }}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <button className="lightbox-btn next" onClick={e => { e.stopPropagation(); setLbIdx(i => (i + 1) % images.length) }}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </>}
          <button className="lightbox-close" onClick={() => setLbIdx(null)}><i className="bi bi-x-lg"></i></button>
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', textAlign: 'center', maxWidth: '80vw' }}>
            <span>{lbIdx + 1} / {images.length}</span>
            {images[lbIdx]?.title && <span style={{ marginLeft: 12 }}>— {images[lbIdx].title}</span>}
            {images[lbIdx]?.dept_name && <span style={{ marginLeft: 12, opacity: 0.7 }}>{images[lbIdx].dept_name}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
