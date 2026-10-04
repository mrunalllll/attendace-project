// ─────────────────────────────────────────────
//  AdminAnnouncements — manage announcements
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Spinner from '../../components/Spinner'
import Alert from '../../components/Alert'
import { adminAnnouncementsAPI, adminDepartmentsAPI } from '../../services/api'

const TYPES = ['info','success','warning','danger']
const TYPE_COLORS = { info: '#3b82f6', success: '#10b981', warning: '#f59e0b', danger: '#ef4444' }
const TYPE_ICONS  = { info: 'bi-info-circle-fill', success: 'bi-check-circle-fill', warning: 'bi-exclamation-triangle-fill', danger: 'bi-x-circle-fill' }

const EMPTY = { title: '', body: '', type: 'info', department_id: '', is_published: '1', is_pinned: '0', expires_at: '' }

export default function AdminAnnouncements() {
  const [announcements, setAnn]   = useState([])
  const [departments, setDepts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [alert, setAlert]         = useState({ type: '', message: '' })
  const [search, setSearch]       = useState('')
  const [filterType, setFT]       = useState('')
  const [filterDept, setFD]       = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editAnn, setEditAnn]     = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [deleteTarget, setDel]    = useState(null)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert({ type: '', message: '' }), 4000)
  }

  const load = async () => {
    try {
      setLoading(true)
      const [annRes, deptRes] = await Promise.all([
        adminAnnouncementsAPI.getAll({ search, type: filterType, dept: filterDept }),
        adminDepartmentsAPI.getAll(),
      ])
      setAnn(annRes.data.announcements || [])
      setDepts(deptRes.data.departments || [])
    } catch {
      showAlert('error', 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, filterType, filterDept])

  const openAdd = () => { setEditAnn(null); setForm(EMPTY); setShowModal(true) }

  const openEdit = (a) => {
    setEditAnn(a)
    setForm({
      title: a.title || '', body: a.body || '', type: a.type || 'info',
      department_id: a.department_id || '',
      is_published: String(a.is_published ?? 1),
      is_pinned: String(a.is_pinned ?? 0),
      expires_at: a.expires_at ? a.expires_at.slice(0, 10) : '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return showAlert('error', 'Title is required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        department_id: form.department_id || null,
        is_published: parseInt(form.is_published),
        is_pinned: parseInt(form.is_pinned),
        expires_at: form.expires_at || null,
      }
      if (editAnn) {
        await adminAnnouncementsAPI.update(editAnn.id, payload)
        showAlert('success', 'Announcement updated')
      } else {
        await adminAnnouncementsAPI.create(payload)
        showAlert('success', 'Announcement created')
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
      await adminAnnouncementsAPI.delete(deleteTarget.id)
      showAlert('success', 'Announcement deleted')
      setDel(null)
      load()
    } catch {
      showAlert('error', 'Delete failed')
    }
  }

  const togglePublish = async (a) => {
    try {
      const res = await adminAnnouncementsAPI.togglePublish(a.id)
      setAnn(prev => prev.map(x => x.id === a.id ? { ...x, is_published: res.data.is_published } : x))
    } catch { showAlert('error', 'Failed') }
  }

  const togglePin = async (a) => {
    try {
      const res = await adminAnnouncementsAPI.togglePin(a.id)
      setAnn(prev => prev.map(x => x.id === a.id ? { ...x, is_pinned: res.data.is_pinned } : x))
    } catch { showAlert('error', 'Failed') }
  }

  const inp = (field) => ({
    value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    className: field === 'body' ? 'form-control-glass' : 'form-control-glass',
  })

  if (loading) return <AdminLayout breadcrumb="Announcements"><Spinner message="Loading..." /></AdminLayout>

  return (
    <AdminLayout breadcrumb="Announcements">
      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="text-gradient fw-bold mb-1">Announcements</h4>
          <p style={{ opacity: 0.6, fontSize: '0.88rem' }}>{announcements.length} announcement(s)</p>
        </div>
        <button className="btn-gradient px-4 py-2 rounded-3" onClick={openAdd}>
          <i className="bi bi-megaphone-fill me-2"></i>New Announcement
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 mb-4">
        <div className="row g-2">
          <div className="col-md-5">
            <div className="input-icon-wrapper">
              <i className="bi bi-search input-icon"></i>
              <input className="form-control-glass" style={{ paddingLeft: '2.5rem' }}
                placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <select className="form-select-glass" value={filterType} onChange={e => setFT(e.target.value)}>
              <option value="">All Types</option>
              {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select-glass" value={filterDept} onChange={e => setFD(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="col-md-1">
            <button className="btn-glass w-100 py-2 rounded-2" onClick={() => { setSearch(''); setFT(''); setFD('') }}>
              <i className="bi bi-x-circle"></i>
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="d-flex flex-column gap-3">
        {announcements.length === 0 ? (
          <div className="glass-card p-5 text-center" style={{ opacity: 0.5 }}>
            <i className="bi bi-megaphone fs-1 d-block mb-2"></i>
            <p>No announcements yet. Create one above!</p>
          </div>
        ) : announcements.map(a => (
          <div key={a.id} className="glass-card p-3" style={{ borderLeft: `4px solid ${TYPE_COLORS[a.type] || '#6b7280'}` }}>
            <div className="d-flex justify-content-between align-items-start gap-3">
              <div className="d-flex gap-3 align-items-start flex-grow-1">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${TYPE_COLORS[a.type]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`bi ${TYPE_ICONS[a.type]} `} style={{ color: TYPE_COLORS[a.type], fontSize: 18 }}></i>
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <span className="fw-semibold" style={{ fontSize: '0.95rem' }}>{a.title}</span>
                    {a.is_pinned === 1 && <span style={{ background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44', borderRadius: 20, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 600 }}>📌 Pinned</span>}
                    {a.dept_name && <span style={{ background: 'var(--primary)22', color: 'var(--primary)', border: '1px solid var(--primary)44', borderRadius: 20, padding: '1px 8px', fontSize: '0.7rem' }}>{a.dept_name}</span>}
                  </div>
                  {a.body && <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0, lineHeight: 1.5 }}>{a.body}</p>}
                  <div className="d-flex gap-3 mt-2" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                    <span><i className="bi bi-clock me-1"></i>{new Date(a.created_at).toLocaleDateString('en-IN')}</span>
                    {a.expires_at && <span><i className="bi bi-calendar-x me-1"></i>Expires {new Date(a.expires_at).toLocaleDateString('en-IN')}</span>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex flex-column gap-1" style={{ flexShrink: 0 }}>
                <button onClick={() => togglePublish(a)}
                  style={{ background: a.is_published ? 'rgba(16,185,129,0.1)' : 'rgba(100,100,100,0.1)', border: `1px solid ${a.is_published ? 'rgba(16,185,129,0.4)' : 'rgba(100,100,100,0.3)'}`, borderRadius: 8, padding: '4px 10px', color: a.is_published ? 'var(--success)' : 'var(--text)', cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <i className={`bi ${a.is_published ? 'bi-eye-fill' : 'bi-eye-slash-fill'} me-1`}></i>
                  {a.is_published ? 'Live' : 'Draft'}
                </button>
                <button onClick={() => togglePin(a)}
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '4px 10px', color: '#f59e0b', cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <i className={`bi ${a.is_pinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'} me-1`}></i>
                  {a.is_pinned ? 'Unpin' : 'Pin'}
                </button>
                <div className="d-flex gap-1">
                  <button className="btn-glass px-2 py-1 rounded-2 flex-grow-1" style={{ fontSize: '0.75rem' }} onClick={() => openEdit(a)}>
                    <i className="bi bi-pencil-fill"></i>
                  </button>
                  <button style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '4px 8px', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => setDel(a)}>
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
          <div className="glass-card p-4" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-gradient fw-bold mb-0">
                <i className={`bi ${editAnn ? 'bi-pencil-fill' : 'bi-megaphone-fill'} me-2`}></i>
                {editAnn ? 'Edit Announcement' : 'New Announcement'}
              </h5>
              <button className="btn-glass px-3 py-1 rounded-2" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label-glass">Title *</label>
                  <input {...inp('title')} placeholder="Announcement title" required />
                </div>
                <div className="col-12">
                  <label className="form-label-glass">Body</label>
                  <textarea {...inp('body')} rows={4} placeholder="Full announcement text..." style={{ resize: 'vertical' }} />
                </div>
                <div className="col-md-6">
                  <label className="form-label-glass">Type</label>
                  <select {...inp('type')} className="form-select-glass">
                    {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label-glass">Department</label>
                  <select {...inp('department_id')} className="form-select-glass">
                    <option value="">— College-wide —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label-glass">Status</label>
                  <select {...inp('is_published')} className="form-select-glass">
                    <option value="1">Published</option>
                    <option value="0">Draft</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label-glass">Pinned</label>
                  <select {...inp('is_pinned')} className="form-select-glass">
                    <option value="0">No</option>
                    <option value="1">Yes — Pin to top</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label-glass">Expires On</label>
                  <input {...inp('expires_at')} type="date" />
                </div>
              </div>
              <div className="d-flex gap-3 mt-4">
                <button type="submit" className="btn-gradient px-4 py-2 rounded-3 flex-grow-1" disabled={saving}>
                  {saving ? 'Saving...' : <><i className="bi bi-check-lg me-2"></i>{editAnn ? 'Update' : 'Publish'}</>}
                </button>
                <button type="button" className="btn-glass px-4 py-2 rounded-3" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-backdrop-glass" onClick={() => setDel(null)}>
          <div className="glass-card p-4 text-center" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h5 className="fw-bold mb-2">Delete Announcement?</h5>
            <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>"{deleteTarget.title}" will be permanently deleted.</p>
            <div className="d-flex gap-3 mt-3">
              <button className="btn-gradient px-4 py-2 rounded-3 flex-grow-1"
                style={{ background: 'linear-gradient(135deg,var(--danger),#c0392b)' }} onClick={handleDelete}>
                <i className="bi bi-trash-fill me-2"></i>Delete
              </button>
              <button className="btn-glass px-4 py-2 rounded-3" onClick={() => setDel(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
