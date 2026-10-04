// ─────────────────────────────────────────────
//  AdminDepartments — manage college departments
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Spinner from '../../components/Spinner'
import Alert from '../../components/Alert'
import { adminDepartmentsAPI } from '../../services/api'

const EMPTY_FORM = {
  name: '', code: '', description: '', hod_name: '', established: '',
  seats: '', status: '1', sort_order: '0',
}

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [alert, setAlert]             = useState({ type: '', message: '' })
  const [search, setSearch]           = useState('')

  // Modal state
  const [showModal, setShowModal]     = useState(false)
  const [editDept, setEditDept]       = useState(null)   // null = add mode
  const [form, setForm]               = useState(EMPTY_FORM)

  // Image previews
  const [imgPrev, setImgPrev]         = useState(null)
  const [bannerPrev, setBannerPrev]   = useState(null)
  const [hodPrev, setHodPrev]         = useState(null)
  const imgRef    = useRef()
  const bannerRef = useRef()
  const hodRef    = useRef()

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert({ type: '', message: '' }), 4000)
  }

  const load = async () => {
    try {
      setLoading(true)
      const res = await adminDepartmentsAPI.getAll()
      setDepartments(res.data.departments || [])
    } catch {
      showAlert('error', 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditDept(null)
    setForm(EMPTY_FORM)
    setImgPrev(null); setBannerPrev(null); setHodPrev(null)
    setShowModal(true)
  }

  const openEdit = (dept) => {
    setEditDept(dept)
    setForm({
      name: dept.name || '', code: dept.code || '',
      description: dept.description || '', hod_name: dept.hod_name || '',
      established: dept.established || '', seats: dept.seats || '',
      status: String(dept.status ?? 1), sort_order: String(dept.sort_order ?? 0),
    })
    setImgPrev(dept.image   ? `/uploads/${dept.image}`    : null)
    setBannerPrev(dept.banner ? `/uploads/${dept.banner}` : null)
    setHodPrev(dept.hod_photo ? `/uploads/${dept.hod_photo}` : null)
    setShowModal(true)
  }

  const handleFile = (e, setPreview) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return showAlert('error', 'Department name is required')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (imgRef.current?.files[0])    fd.append('image',     imgRef.current.files[0])
      if (bannerRef.current?.files[0]) fd.append('banner',    bannerRef.current.files[0])
      if (hodRef.current?.files[0])    fd.append('hod_photo', hodRef.current.files[0])

      if (editDept) {
        await adminDepartmentsAPI.update(editDept.id, fd)
        showAlert('success', 'Department updated successfully')
      } else {
        await adminDepartmentsAPI.create(fd)
        showAlert('success', 'Department added successfully')
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
      await adminDepartmentsAPI.delete(deleteTarget.id)
      showAlert('success', `"${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      load()
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Delete failed')
    }
  }

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code || '').toLowerCase().includes(search.toLowerCase())
  )

  const inp = (field) => ({
    value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    className: 'form-control-glass',
  })

  if (loading) return <AdminLayout breadcrumb="Departments"><Spinner message="Loading departments..." /></AdminLayout>

  return (
    <AdminLayout breadcrumb="Departments">
      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="text-gradient fw-bold mb-1">Departments</h4>
          <p style={{ opacity: 0.6, fontSize: '0.88rem' }}>{departments.length} department(s) total</p>
        </div>
        <button className="btn-gradient px-4 py-2 rounded-3" onClick={openAdd}>
          <i className="bi bi-plus-lg me-2"></i>Add Department
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-3 mb-4">
        <div className="input-icon-wrapper">
          <i className="bi bi-search input-icon"></i>
          <input className="form-control-glass" style={{ paddingLeft: '2.5rem' }}
            placeholder="Search departments..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card p-0 overflow-hidden">
        <table className="table-glass w-100">
          <thead>
            <tr>
              <th>Department</th>
              <th>Code</th>
              <th>HOD</th>
              <th>Events</th>
              <th>Gallery</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-5" style={{ opacity: 0.5 }}>
                <i className="bi bi-building fs-2 d-block mb-2"></i>No departments found
              </td></tr>
            ) : filtered.map(dept => (
              <tr key={dept.id}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    {dept.image
                      ? <img src={`/uploads/${dept.image}`} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                      : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="bi bi-building text-white" style={{ fontSize: 18 }}></i>
                        </div>
                    }
                    <div>
                      <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{dept.name}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{dept.description?.slice(0, 50)}{dept.description?.length > 50 ? '…' : ''}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge-gradient px-2 py-1 rounded">{dept.code || '—'}</span></td>
                <td style={{ fontSize: '0.85rem' }}>{dept.hod_name || '—'}</td>
                <td><span className="badge-info px-2 py-1 rounded">{dept.event_count || 0}</span></td>
                <td><span className="badge-info px-2 py-1 rounded">{dept.gallery_count || 0}</span></td>
                <td>
                  <span className={`badge-${dept.status ? 'success' : 'danger'} px-2 py-1 rounded`}>
                    {dept.status ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <button className="btn-glass px-3 py-1 rounded-2" style={{ fontSize: '0.8rem' }} onClick={() => openEdit(dept)}>
                      <i className="bi bi-pencil-fill me-1"></i>Edit
                    </button>
                    <button className="px-3 py-1 rounded-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer' }}
                      onClick={() => setDeleteTarget(dept)}>
                      <i className="bi bi-trash-fill me-1"></i>Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop-glass" onClick={() => setShowModal(false)}>
          <div className="glass-card p-4" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-gradient fw-bold mb-0">
                <i className={`bi ${editDept ? 'bi-pencil-fill' : 'bi-plus-circle-fill'} me-2`}></i>
                {editDept ? 'Edit Department' : 'Add Department'}
              </h5>
              <button className="btn-glass px-3 py-1 rounded-2" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label-glass">Department Name *</label>
                  <input {...inp('name')} placeholder="e.g. Computer Science & Engineering" required />
                </div>
                <div className="col-md-4">
                  <label className="form-label-glass">Code</label>
                  <input {...inp('code')} placeholder="e.g. CSE" />
                </div>
                <div className="col-12">
                  <label className="form-label-glass">Description</label>
                  <textarea {...inp('description')} rows={3} placeholder="About this department..." style={{ resize: 'vertical' }} />
                </div>
                <div className="col-md-6">
                  <label className="form-label-glass">HOD Name</label>
                  <input {...inp('hod_name')} placeholder="Dr. John Doe" />
                </div>
                <div className="col-md-3">
                  <label className="form-label-glass">Established</label>
                  <input {...inp('established')} placeholder="2010" />
                </div>
                <div className="col-md-3">
                  <label className="form-label-glass">Seats</label>
                  <input {...inp('seats')} type="number" placeholder="60" />
                </div>

                {/* Images */}
                <div className="col-md-4">
                  <label className="form-label-glass">Department Image</label>
                  <div className="img-upload-box" onClick={() => imgRef.current.click()}
                    style={{ cursor: 'pointer', border: '2px dashed var(--border)', borderRadius: 12, padding: 16, textAlign: 'center', background: 'var(--input-bg)' }}>
                    {imgPrev
                      ? <img src={imgPrev} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />
                      : <><i className="bi bi-image fs-2" style={{ opacity: 0.4 }}></i><p style={{ fontSize: '0.75rem', opacity: 0.5, margin: 0 }}>Click to upload</p></>}
                  </div>
                  <input type="file" ref={imgRef} accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, setImgPrev)} />
                </div>

                <div className="col-md-4">
                  <label className="form-label-glass">Banner Image</label>
                  <div className="img-upload-box" onClick={() => bannerRef.current.click()}
                    style={{ cursor: 'pointer', border: '2px dashed var(--border)', borderRadius: 12, padding: 16, textAlign: 'center', background: 'var(--input-bg)' }}>
                    {bannerPrev
                      ? <img src={bannerPrev} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />
                      : <><i className="bi bi-panorama fs-2" style={{ opacity: 0.4 }}></i><p style={{ fontSize: '0.75rem', opacity: 0.5, margin: 0 }}>Click to upload</p></>}
                  </div>
                  <input type="file" ref={bannerRef} accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, setBannerPrev)} />
                </div>

                <div className="col-md-4">
                  <label className="form-label-glass">HOD Photo</label>
                  <div className="img-upload-box" onClick={() => hodRef.current.click()}
                    style={{ cursor: 'pointer', border: '2px dashed var(--border)', borderRadius: 12, padding: 16, textAlign: 'center', background: 'var(--input-bg)' }}>
                    {hodPrev
                      ? <img src={hodPrev} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: '50%' }} />
                      : <><i className="bi bi-person-circle fs-2" style={{ opacity: 0.4 }}></i><p style={{ fontSize: '0.75rem', opacity: 0.5, margin: 0 }}>Click to upload</p></>}
                  </div>
                  <input type="file" ref={hodRef} accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, setHodPrev)} />
                </div>

                <div className="col-md-4">
                  <label className="form-label-glass">Status</label>
                  <select {...inp('status')} className="form-select-glass">
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label-glass">Sort Order</label>
                  <input {...inp('sort_order')} type="number" placeholder="0" />
                </div>
              </div>

              <div className="d-flex gap-3 mt-4">
                <button type="submit" className="btn-gradient px-4 py-2 rounded-3 flex-grow-1" disabled={saving}>
                  {saving ? <><i className="bi bi-hourglass-split me-2"></i>Saving...</> : <><i className="bi bi-check-lg me-2"></i>{editDept ? 'Update' : 'Add Department'}</>}
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
            <h5 className="fw-bold mb-2">Delete Department?</h5>
            <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
              This will delete <strong>"{deleteTarget.name}"</strong> and all its associated events, gallery, and faculty. This cannot be undone.
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
