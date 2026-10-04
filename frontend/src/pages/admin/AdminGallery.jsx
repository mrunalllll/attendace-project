// ─────────────────────────────────────────────
//  AdminGallery — manage college-wide photo gallery
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Spinner from '../../components/Spinner'
import Alert from '../../components/Alert'
import { adminGalleryAPI, adminDepartmentsAPI, adminEventsAPI } from '../../services/api'

const CATEGORIES = ['Campus','Buildings','Classrooms','Labs','Library','Sports','Auditorium','Events','Students','Faculty','Achievements','General']

export default function AdminGallery() {
  const [images, setImages]         = useState([])
  const [departments, setDepts]     = useState([])
  const [events, setEvents]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [uploading, setUploading]   = useState(false)
  const [alert, setAlert]           = useState({ type: '', message: '' })

  // Filters
  const [filterCat, setFC]  = useState('')
  const [filterDept, setFD] = useState('')
  const [search, setSearch] = useState('')

  // Upload state
  const [previews, setPreviews]     = useState([])
  const [uploadCat, setUploadCat]   = useState('General')
  const [uploadDept, setUploadDept] = useState('')
  const [uploadEvent, setUploadEv]  = useState('')
  const [uploadFeat, setUploadFeat] = useState(false)
  const fileRef = useRef()

  // Edit modal
  const [editImg, setEditImg]       = useState(null)
  const [editForm, setEditForm]     = useState({})

  // Selected for bulk delete
  const [selected, setSelected]     = useState(new Set())

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert({ type: '', message: '' }), 4000)
  }

  const load = async () => {
    try {
      setLoading(true)
      const [gallRes, deptRes, evRes] = await Promise.all([
        adminGalleryAPI.getAll({ category: filterCat, dept: filterDept, search }),
        adminDepartmentsAPI.getAll(),
        adminEventsAPI.getAll({}),
      ])
      setImages(gallRes.data.images || [])
      setDepts(deptRes.data.departments || [])
      setEvents(evRes.data.events || [])
    } catch {
      showAlert('error', 'Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterCat, filterDept, search])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const newPrevs = files.map(f => ({ file: f, url: URL.createObjectURL(f), title: '' }))
    setPreviews(prev => [...prev, ...newPrevs])
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!previews.length) return showAlert('error', 'Select at least one photo')
    setUploading(true)
    try {
      const fd = new FormData()
      previews.forEach(p => fd.append('photos', p.file))
      previews.forEach(p => fd.append('titles', p.title))
      fd.append('category', uploadCat)
      if (uploadDept)  fd.append('department_id', uploadDept)
      if (uploadEvent) fd.append('event_id', uploadEvent)
      if (uploadFeat)  fd.append('is_featured', '1')
      await adminGalleryAPI.upload(fd)
      showAlert('success', `${previews.length} photo(s) uploaded!`)
      setPreviews([])
      load()
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this image?')) return
    try {
      await adminGalleryAPI.delete(id)
      setImages(prev => prev.filter(i => i.id !== id))
      showAlert('success', 'Image deleted')
    } catch {
      showAlert('error', 'Delete failed')
    }
  }

  const handleBulkDelete = async () => {
    if (!selected.size) return
    if (!window.confirm(`Delete ${selected.size} selected image(s)?`)) return
    try {
      await adminGalleryAPI.bulkDelete([...selected])
      showAlert('success', `${selected.size} image(s) deleted`)
      setSelected(new Set())
      load()
    } catch {
      showAlert('error', 'Bulk delete failed')
    }
  }

  const openEdit = (img) => {
    setEditImg(img)
    setEditForm({
      title: img.title || '',
      category: img.category || 'General',
      department_id: img.department_id || '',
      event_id: img.event_id || '',
      is_featured: img.is_featured ? true : false,
    })
  }

  const handleEditSave = async () => {
    try {
      await adminGalleryAPI.update(editImg.id, {
        ...editForm,
        department_id: editForm.department_id || null,
        event_id: editForm.event_id || null,
        is_featured: editForm.is_featured ? 1 : 0,
      })
      showAlert('success', 'Image updated')
      setEditImg(null)
      load()
    } catch {
      showAlert('error', 'Update failed')
    }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === images.length) setSelected(new Set())
    else setSelected(new Set(images.map(i => i.id)))
  }

  if (loading) return <AdminLayout breadcrumb="Gallery"><Spinner message="Loading gallery..." /></AdminLayout>

  return (
    <AdminLayout breadcrumb="Gallery">
      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="text-gradient fw-bold mb-1">College Gallery</h4>
          <p style={{ opacity: 0.6, fontSize: '0.88rem' }}>{images.length} image(s) total</p>
        </div>
        {selected.size > 0 && (
          <button onClick={handleBulkDelete}
            style={{ background: 'linear-gradient(135deg,var(--danger),#c0392b)', border: 'none', borderRadius: 10, padding: '8px 20px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            <i className="bi bi-trash-fill me-2"></i>Delete Selected ({selected.size})
          </button>
        )}
      </div>

      {/* Upload Panel */}
      <div className="glass-card p-4 mb-4">
        <h6 className="fw-semibold mb-3"><i className="bi bi-cloud-upload-fill me-2" style={{ color: 'var(--primary)' }}></i>Upload Photos</h6>
        <div className="row g-3 mb-3">
          <div className="col-md-3">
            <label className="form-label-glass">Category</label>
            <select className="form-select-glass" value={uploadCat} onChange={e => setUploadCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label-glass">Department (optional)</label>
            <select className="form-select-glass" value={uploadDept} onChange={e => setUploadDept(e.target.value)}>
              <option value="">— None —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label-glass">Event (optional)</label>
            <select className="form-select-glass" value={uploadEvent} onChange={e => setUploadEv(e.target.value)}>
              <option value="">— None —</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <label className="d-flex align-items-center gap-2 cursor-pointer" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={uploadFeat} onChange={e => setUploadFeat(e.target.checked)} />
              <span style={{ fontSize: '0.88rem' }}>Feature on Homepage</span>
            </label>
          </div>
        </div>

        {/* Drop zone */}
        <div onClick={() => fileRef.current.click()}
          style={{ border: '2px dashed var(--primary)', borderRadius: 16, padding: 24, textAlign: 'center', cursor: 'pointer', background: 'rgba(79,70,229,0.04)' }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
            setPreviews(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f), title: '' }))])
          }}>
          <i className="bi bi-images fs-2 d-block mb-1" style={{ color: 'var(--primary)', opacity: 0.6 }}></i>
          <p className="mb-0" style={{ color: 'var(--primary)', fontWeight: 600 }}>Click or drag & drop photos</p>
          <p style={{ fontSize: '0.78rem', opacity: 0.5, marginTop: 4 }}>Multiple files supported</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileSelect} />

        {previews.length > 0 && (
          <>
            <div className="row g-2 mt-3">
              {previews.map((p, idx) => (
                <div className="col-4 col-md-2" key={idx}>
                  <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '2px solid var(--primary)' }}>
                    <img src={p.url} alt="" style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                    <button onClick={() => setPreviews(prev => prev.filter((_, i) => i !== idx))}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', width: 20, height: 20, color: '#fff', cursor: 'pointer', fontSize: 10 }}>✕</button>
                  </div>
                  <input className="form-control-glass mt-1" style={{ fontSize: '0.72rem', padding: '3px 6px' }}
                    placeholder="Title (opt.)" value={p.title}
                    onChange={e => setPreviews(prev => prev.map((pp, i) => i === idx ? { ...pp, title: e.target.value } : pp))} />
                </div>
              ))}
            </div>
            <div className="d-flex gap-3 mt-3">
              <button className="btn-gradient px-5 py-2 rounded-3" onClick={handleUpload} disabled={uploading}>
                {uploading ? <><i className="bi bi-hourglass-split me-2"></i>Uploading...</> : <><i className="bi bi-cloud-upload-fill me-2"></i>Upload {previews.length} Photo(s)</>}
              </button>
              <button className="btn-glass px-4 py-2 rounded-3" onClick={() => setPreviews([])}>Clear</button>
            </div>
          </>
        )}
      </div>

      {/* Filters + Gallery */}
      <div className="glass-card p-4">
        <div className="row g-2 mb-4">
          <div className="col-md-4">
            <div className="input-icon-wrapper">
              <i className="bi bi-search input-icon"></i>
              <input className="form-control-glass" style={{ paddingLeft: '2.5rem' }}
                placeholder="Search images..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <select className="form-select-glass" value={filterCat} onChange={e => setFC(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select-glass" value={filterDept} onChange={e => setFD(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn-glass w-100 py-2 rounded-2" onClick={selectAll}>
              {selected.size === images.length && images.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-5" style={{ opacity: 0.4 }}>
            <i className="bi bi-images fs-1 d-block mb-2"></i>
            <p>No images found. Upload some above.</p>
          </div>
        ) : (
          <div className="row g-2">
            {images.map(img => (
              <div className="col-6 col-md-3 col-lg-2" key={img.id}>
                <div className="glass-card p-0 overflow-hidden" style={{ border: selected.has(img.id) ? '2px solid var(--primary)' : '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ position: 'relative' }} onClick={() => toggleSelect(img.id)}>
                    <img src={`/uploads/${img.photo}`} alt={img.title || ''}
                      style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                    {selected.has(img.id) && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(79,70,229,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="bi bi-check-circle-fill text-white fs-3"></i>
                      </div>
                    )}
                    {img.is_featured === 1 && (
                      <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(245,158,11,0.9)', borderRadius: 20, padding: '2px 7px', fontSize: '0.68rem', color: '#fff', fontWeight: 600 }}>
                        ★ Featured
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '6px 8px', display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(img)}
                      style={{ flex: 1, background: 'rgba(79,70,229,0.1)', border: 'none', borderRadius: 6, padding: '4px 0', color: 'var(--primary)', cursor: 'pointer', fontSize: 12 }}>
                      <i className="bi bi-pencil-fill"></i>
                    </button>
                    <button onClick={() => handleDelete(img.id)}
                      style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, padding: '4px 0', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>
                      <i className="bi bi-trash-fill"></i>
                    </button>
                  </div>
                  {img.title && <p style={{ fontSize: '0.7rem', margin: '0 8px 6px', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.title}</p>}
                  <p style={{ fontSize: '0.65rem', margin: '0 8px 6px', opacity: 0.4 }}>{img.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editImg && (
        <div className="modal-backdrop-glass" onClick={() => setEditImg(null)}>
          <div className="glass-card p-4" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-gradient mb-0">Edit Image Details</h6>
              <button className="btn-glass px-3 py-1 rounded-2" onClick={() => setEditImg(null)}>✕</button>
            </div>
            <img src={`/uploads/${editImg.photo}`} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 16 }} />
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label-glass">Title</label>
                <input className="form-control-glass" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Image title" />
              </div>
              <div className="col-md-6">
                <label className="form-label-glass">Category</label>
                <select className="form-select-glass" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label-glass">Department</label>
                <select className="form-select-glass" value={editForm.department_id} onChange={e => setEditForm(f => ({ ...f, department_id: e.target.value }))}>
                  <option value="">— None —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={editForm.is_featured} onChange={e => setEditForm(f => ({ ...f, is_featured: e.target.checked }))} />
                  <span>Feature on Homepage</span>
                </label>
              </div>
            </div>
            <div className="d-flex gap-3 mt-4">
              <button className="btn-gradient px-4 py-2 rounded-3 flex-grow-1" onClick={handleEditSave}>
                <i className="bi bi-check-lg me-2"></i>Save
              </button>
              <button className="btn-glass px-4 py-2 rounded-3" onClick={() => setEditImg(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
