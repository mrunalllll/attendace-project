// ─────────────────────────────────────────────
//  AdminEvents — manage college events
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import Spinner from '../../components/Spinner'
import Alert from '../../components/Alert'
import { adminEventsAPI, adminDepartmentsAPI } from '../../services/api'

const CATEGORIES = ['Freshers','Farewell','Workshop','Seminar','Hackathon','Technical','Cultural','Sports','Fest','Other']
const STATUSES   = ['upcoming','ongoing','completed','cancelled']

const EMPTY_FORM = {
  title: '', description: '', department_id: '', category: 'Other',
  event_date: '', start_time: '', end_time: '', venue: '',
  organizer: '', registration_info: '', status: 'upcoming', is_published: '1',
}

const CAT_COLORS = {
  Freshers:'#06b6d4', Farewell:'#7c3aed', Workshop:'#f59e0b',
  Seminar:'#3b82f6', Hackathon:'#ef4444', Technical:'#10b981',
  Cultural:'#f97316', Sports:'#84cc16', Fest:'#ec4899', Other:'#6b7280',
}

export default function AdminEvents() {
  const navigate = useNavigate()
  const [events, setEvents]           = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [alert, setAlert]             = useState({ type: '', message: '' })

  // Filters
  const [search, setSearch]   = useState('')
  const [filterDept, setFD]   = useState('')
  const [filterCat, setFC]    = useState('')
  const [filterStat, setFS]   = useState('')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [posterPrev, setPosterPrev] = useState(null)
  const posterRef = useRef()

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert({ type: '', message: '' }), 4000)
  }

  const load = async () => {
    try {
      setLoading(true)
      const [evRes, deptRes] = await Promise.all([
        adminEventsAPI.getAll({ search, dept: filterDept, category: filterCat, status: filterStat }),
        adminDepartmentsAPI.getAll(),
      ])
      setEvents(evRes.data.events || [])
      setDepartments(deptRes.data.departments || [])
    } catch {
      showAlert('error', 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, filterDept, filterCat, filterStat])

  const openAdd = () => {
    setEditEvent(null)
    setForm(EMPTY_FORM)
    setPosterPrev(null)
    setShowModal(true)
  }

  const openEdit = (ev) => {
    setEditEvent(ev)
    setForm({
      title: ev.title || '', description: ev.description || '',
      department_id: ev.department_id || '', category: ev.category || 'Other',
      event_date: ev.event_date ? ev.event_date.slice(0, 10) : '',
      start_time: ev.start_time || '', end_time: ev.end_time || '',
      venue: ev.venue || '', organizer: ev.organizer || '',
      registration_info: ev.registration_info || '',
      status: ev.status || 'upcoming', is_published: String(ev.is_published ?? 1),
    })
    setPosterPrev(ev.poster ? `/uploads/${ev.poster}` : null)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return showAlert('error', 'Event title is required')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (posterRef.current?.files[0]) fd.append('poster', posterRef.current.files[0])

      if (editEvent) {
        await adminEventsAPI.update(editEvent.id, fd)
        showAlert('success', 'Event updated successfully')
      } else {
        await adminEventsAPI.create(fd)
        showAlert('success', 'Event created successfully')
      }
      setShowModal(false)
      load()
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await adminEventsAPI.delete(deleteTarget.id)
      showAlert('success', `"${deleteTarget.title}" deleted`)
      setDeleteTarget(null)
      load()
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Delete failed')
    }
  }

  const handleTogglePublish = async (ev) => {
    try {
      const res = await adminEventsAPI.togglePublish(ev.id)
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_published: res.data.is_published } : e))
    } catch {
      showAlert('error', 'Failed to toggle publish status')
    }
  }

  const inp = (field) => ({
    value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    className: field === 'description' || field === 'registration_info' ? 'form-control-glass' : 'form-control-glass',
  })

  const statusBadge = (s) => {
    const map = { upcoming: 'info', ongoing: 'success', completed: 'warning', cancelled: 'danger' }
    return <span className={`badge-${map[s] || 'info'} px-2 py-1 rounded`} style={{ fontSize: '0.75rem' }}>{s}</span>
  }

  if (loading) return <AdminLayout breadcrumb="Events"><Spinner message="Loading events..." /></AdminLayout>

  return (
    <AdminLayout breadcrumb="Events">
      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="text-gradient fw-bold mb-1">Events</h4>
          <p style={{ opacity: 0.6, fontSize: '0.88rem' }}>{events.length} event(s) total</p>
        </div>
        <button className="btn-gradient px-4 py-2 rounded-3" onClick={openAdd}>
          <i className="bi bi-plus-lg me-2"></i>Add Event
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 mb-4">
        <div className="row g-2">
          <div className="col-md-4">
            <div className="input-icon-wrapper">
              <i className="bi bi-search input-icon"></i>
              <input className="form-control-glass" style={{ paddingLeft: '2.5rem' }}
                placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <select className="form-select-glass" value={filterDept} onChange={e => setFD(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select-glass" value={filterCat} onChange={e => setFC(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select-glass" value={filterStat} onChange={e => setFS(e.target.value)}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-md-1">
            <button className="btn-glass w-100 py-2 rounded-2" onClick={() => { setSearch(''); setFD(''); setFC(''); setFS('') }}>
              <i className="bi bi-x-circle"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="row g-3">
        {events.length === 0 ? (
          <div className="col-12 text-center py-5 glass-card">
            <i className="bi bi-calendar-x fs-1 d-block mb-3" style={{ opacity: 0.3 }}></i>
            <p style={{ opacity: 0.5 }}>No events found. Add your first event!</p>
          </div>
        ) : events.map(ev => (
          <div className="col-md-6 col-xl-4" key={ev.id}>
            <div className="glass-card p-0 overflow-hidden h-100 d-flex flex-column">
              {/* Poster */}
              <div style={{ position: 'relative', height: 160, background: 'linear-gradient(135deg,var(--primary),var(--secondary))', overflow: 'hidden' }}>
                {ev.poster
                  ? <img src={`/uploads/${ev.poster}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <i className="bi bi-calendar-event text-white" style={{ fontSize: 48, opacity: 0.5 }}></i>
                    </div>}
                {/* Category badge */}
                <div style={{ position: 'absolute', top: 10, left: 10 }}>
                  <span style={{ background: CAT_COLORS[ev.category] || '#6b7280', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
                    {ev.category}
                  </span>
                </div>
                {/* Publish toggle */}
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <button onClick={() => handleTogglePublish(ev)}
                    style={{ background: ev.is_published ? 'rgba(16,185,129,0.9)' : 'rgba(100,100,100,0.8)', border: 'none', borderRadius: 20, padding: '3px 10px', color: '#fff', fontSize: '0.72rem', cursor: 'pointer' }}>
                    <i className={`bi ${ev.is_published ? 'bi-eye-fill' : 'bi-eye-slash-fill'} me-1`}></i>
                    {ev.is_published ? 'Live' : 'Draft'}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-3 flex-grow-1 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <h6 className="fw-bold mb-0" style={{ fontSize: '0.95rem', lineHeight: 1.3 }}>{ev.title}</h6>
                  {statusBadge(ev.status)}
                </div>
                {ev.dept_name && <p style={{ fontSize: '0.78rem', opacity: 0.6, marginBottom: 4 }}><i className="bi bi-building me-1"></i>{ev.dept_name}</p>}
                {ev.event_date && <p style={{ fontSize: '0.78rem', opacity: 0.6, marginBottom: 4 }}><i className="bi bi-calendar3 me-1"></i>{new Date(ev.event_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>}
                {ev.venue && <p style={{ fontSize: '0.78rem', opacity: 0.6, marginBottom: 0 }}><i className="bi bi-geo-alt me-1"></i>{ev.venue}</p>}

                <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 6 }}>
                  <i className="bi bi-images me-1"></i>{ev.photo_count || 0} photos
                </div>

                {/* Actions */}
                <div className="d-flex gap-2 mt-auto pt-3">
                  <button className="btn-glass px-3 py-1 rounded-2 flex-grow-1" style={{ fontSize: '0.8rem' }} onClick={() => openEdit(ev)}>
                    <i className="bi bi-pencil-fill me-1"></i>Edit
                  </button>
                  <button className="btn-glass px-3 py-1 rounded-2 flex-grow-1" style={{ fontSize: '0.8rem' }}
                    onClick={() => navigate(`/admin/events/${ev.id}/photos`)}>
                    <i className="bi bi-images me-1"></i>Photos
                  </button>
                  <button className="px-3 py-1 rounded-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer' }}
                    onClick={() => setDeleteTarget(ev)}>
                    <i className="bi bi-trash-fill"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop-glass" onClick={() => setShowModal(false)}>
          <div className="glass-card p-4" style={{ width: '100%', maxWidth: 760, maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-gradient fw-bold mb-0">
                <i className={`bi ${editEvent ? 'bi-pencil-fill' : 'bi-calendar-plus-fill'} me-2`}></i>
                {editEvent ? 'Edit Event' : 'Add Event'}
              </h5>
              <button className="btn-glass px-3 py-1 rounded-2" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label-glass">Event Title *</label>
                  <input {...inp('title')} placeholder="e.g. AIML Freshers Party 2026" required />
                </div>
                <div className="col-md-4">
                  <label className="form-label-glass">Category</label>
                  <select {...inp('category')} className="form-select-glass">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label-glass">Department</label>
                  <select {...inp('department_id')} className="form-select-glass">
                    <option value="">— No Department —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label-glass">Status</label>
                  <select {...inp('status')} className="form-select-glass">
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label-glass">Event Date</label>
                  <input {...inp('event_date')} type="date" />
                </div>
                <div className="col-md-4">
                  <label className="form-label-glass">Start Time</label>
                  <input {...inp('start_time')} type="time" />
                </div>
                <div className="col-md-4">
                  <label className="form-label-glass">End Time</label>
                  <input {...inp('end_time')} type="time" />
                </div>
                <div className="col-md-6">
                  <label className="form-label-glass">Venue</label>
                  <input {...inp('venue')} placeholder="College Auditorium" />
                </div>
                <div className="col-md-6">
                  <label className="form-label-glass">Organizer</label>
                  <input {...inp('organizer')} placeholder="Event Committee" />
                </div>
                <div className="col-12">
                  <label className="form-label-glass">Description</label>
                  <textarea {...inp('description')} rows={3} placeholder="Event description..." style={{ resize: 'vertical' }} />
                </div>
                <div className="col-12">
                  <label className="form-label-glass">Registration Info</label>
                  <textarea {...inp('registration_info')} rows={2} placeholder="How to register, fees, deadline..." style={{ resize: 'vertical' }} />
                </div>

                {/* Poster */}
                <div className="col-md-6">
                  <label className="form-label-glass">Event Poster</label>
                  <div onClick={() => posterRef.current.click()} style={{ cursor: 'pointer', border: '2px dashed var(--border)', borderRadius: 12, padding: 16, textAlign: 'center', background: 'var(--input-bg)', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {posterPrev
                      ? <img src={posterPrev} alt="" style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 8, objectFit: 'contain' }} />
                      : <div><i className="bi bi-image fs-2" style={{ opacity: 0.4 }}></i><p style={{ fontSize: '0.75rem', opacity: 0.5, margin: 0 }}>Click to upload poster</p></div>}
                  </div>
                  <input type="file" ref={posterRef} accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setPosterPrev(ev.target.result); r.readAsDataURL(f) } }} />
                </div>

                <div className="col-md-6">
                  <label className="form-label-glass">Published</label>
                  <select {...inp('is_published')} className="form-select-glass">
                    <option value="1">Published (Live)</option>
                    <option value="0">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="d-flex gap-3 mt-4">
                <button type="submit" className="btn-gradient px-4 py-2 rounded-3 flex-grow-1" disabled={saving}>
                  {saving ? <><i className="bi bi-hourglass-split me-2"></i>Saving...</> : <><i className="bi bi-check-lg me-2"></i>{editEvent ? 'Update Event' : 'Create Event'}</>}
                </button>
                <button type="button" className="btn-glass px-4 py-2 rounded-3" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-backdrop-glass" onClick={() => setDeleteTarget(null)}>
          <div className="glass-card p-4 text-center" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h5 className="fw-bold mb-2">Delete Event?</h5>
            <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
              "<strong>{deleteTarget.title}</strong>" and all its photos will be permanently deleted.
            </p>
            <div className="d-flex gap-3 mt-3">
              <button className="btn-gradient px-4 py-2 rounded-3 flex-grow-1"
                style={{ background: 'linear-gradient(135deg,var(--danger),#c0392b)' }}
                onClick={handleDelete}>
                <i className="bi bi-trash-fill me-2"></i>Delete
              </button>
              <button className="btn-glass px-4 py-2 rounded-3" onClick={() => setDeleteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
