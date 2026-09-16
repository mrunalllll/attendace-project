// ─────────────────────────────────────────────
//  AdminCandidates.jsx
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Spinner     from '../../components/Spinner'
import Alert       from '../../components/Alert'
import { adminAPI } from '../../services/api'

const EMPTY_FORM = { name: '', party: '', mobile: '', email: '', manifesto: '', status: 1 }

export default function AdminCandidates() {
  const [candidates,  setCandidates]  = useState([])
  const [totalVotes,  setTotalVotes]  = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [alert,       setAlert]       = useState({ type: '', msg: '' })
  const [search,      setSearch]      = useState('')
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [editId,      setEditId]      = useState(null)   // null = add mode
  const [photo,       setPhoto]       = useState(null)
  const [preview,     setPreview]     = useState('')
  const [showModal,   setShowModal]   = useState(false)
  const [deleteId,    setDeleteId]    = useState(null)
  const fileRef = useRef()

  async function load() {
    try {
      const r = await adminAPI.getCandidates()
      setCandidates(r.data.candidates || [])
      setTotalVotes(r.data.total_votes || 0)
    } catch { setAlert({ type: 'error', msg: 'Failed to load candidates.' }) }
    finally  { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setForm(EMPTY_FORM); setEditId(null); setPhoto(null); setPreview(''); setShowModal(true)
  }

  function openEdit(c) {
    setForm({ name: c.name, party: c.party, mobile: c.mobile || '', email: c.email || '',
              manifesto: c.manifesto || '', status: c.status })
    setEditId(c.id); setPhoto(null); setPreview(`/uploads/${c.photo || 'default.png'}`); setShowModal(true)
  }

  function handlePhoto(e) {
    const f = e.target.files[0]; if (!f) return
    setPhoto(f)
    const r = new FileReader(); r.onload = ev => setPreview(ev.target.result); r.readAsDataURL(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.party.trim())
      return setAlert({ type: 'error', msg: 'Name and party are required.' })
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (photo) fd.append('photo', photo)
    try {
      if (editId) {
        await adminAPI.updateCandidate(editId, fd)
        setAlert({ type: 'success', msg: 'Candidate updated.' })
      } else {
        await adminAPI.addCandidate(fd)
        setAlert({ type: 'success', msg: 'Candidate added.' })
      }
      setShowModal(false); load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to save.' })
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await adminAPI.deleteCandidate(deleteId)
      setAlert({ type: 'success', msg: 'Candidate deleted.' })
      setDeleteId(null); load()
    } catch { setAlert({ type: 'error', msg: 'Failed to delete.' }) }
  }

  async function handleToggle(id) {
    try { await adminAPI.toggleCandidate(id); load() }
    catch { setAlert({ type: 'error', msg: 'Failed to toggle status.' }) }
  }

  const filtered = candidates.filter(c =>
    `${c.name} ${c.party}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <AdminLayout breadcrumb="Candidates"><Spinner message="Loading..." /></AdminLayout>

  return (
    <AdminLayout breadcrumb="Candidates">
      {alert.msg && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert({ type: '', msg: '' })} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div className="text-gradient" style={{ fontSize: '1.3rem', fontWeight: 800 }}>Candidates</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.55 }}>{candidates.length} total · {totalVotes} votes cast</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="input-icon-wrapper" style={{ width: 240 }}>
            <i className="bi bi-search input-icon" />
            <input type="text" className="form-control-glass" placeholder="Search..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-gradient" onClick={openAdd}>
            <i className="bi bi-plus-lg" /> Add Candidate
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        {filtered.length === 0
          ? <p style={{ textAlign: 'center', opacity: 0.5, padding: '3rem' }}>No candidates found.</p>
          : (
            <table className="table-glass">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Party</th>
                  <th>Votes</th>
                  <th>%</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ opacity: 0.5 }}>{i + 1}</td>
                    <td>
                      <img src={`/uploads/${c.photo || 'default.png'}`} className="avatar" alt="" />
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ opacity: 0.7 }}>{c.party}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{c.vote_count}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 80 }}>
                        <div className="progress-glass" style={{ flexGrow: 1 }}>
                          <div className="progress-fill" style={{ width: `${c.pct}%` }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{c.pct}%</span>
                      </div>
                    </td>
                    <td>
                      <button
                        className={c.status ? 'badge-success' : 'badge-danger'}
                        style={{ border: 'none', cursor: 'pointer', fontFamily: 'Poppins' }}
                        onClick={() => handleToggle(c.id)}
                        title="Click to toggle"
                      >
                        {c.status ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-glass" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          onClick={() => openEdit(c)}>
                          <i className="bi bi-pencil-fill" />
                        </button>
                        <button className="btn-glass" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--danger)' }}
                          onClick={() => setDeleteId(c.id)}>
                          <i className="bi bi-trash-fill" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(6px)', padding: '1rem', overflowY: 'auto' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 520, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div className="text-gradient" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                {editId ? 'Edit Candidate' : 'Add Candidate'}
              </div>
              <button className="btn-glass" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Photo */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div className="img-preview-wrap" onClick={() => fileRef.current.click()}>
                  <img src={preview || '/uploads/default.png'} alt="preview" />
                  <div className="img-overlay"><i className="bi bi-camera-fill" /></div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                <div style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: 4 }}>Click to upload photo</div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control-glass" placeholder="Candidate name" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="col-12">
                  <label className="form-label">Party *</label>
                  <input className="form-control-glass" placeholder="Party name" value={form.party}
                    onChange={e => setForm(f => ({ ...f, party: e.target.value }))} required />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Mobile</label>
                  <input className="form-control-glass" placeholder="10-digit mobile" value={form.mobile}
                    onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control-glass" placeholder="email@example.com" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label">Manifesto</label>
                  <textarea className="form-control-glass" rows={3} placeholder="Brief manifesto..."
                    value={form.manifesto} onChange={e => setForm(f => ({ ...f, manifesto: e.target.value }))}
                    style={{ resize: 'vertical' }} />
                </div>
                <div className="col-12">
                  <label className="form-label">Status</label>
                  <select className="form-select-glass" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: parseInt(e.target.value) }))}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
                <div className="col-12" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-glass" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-gradient" disabled={saving}>
                    {saving ? 'Saving...' : editId ? 'Update Candidate' : 'Add Candidate'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: 400, width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🗑️</div>
            <h4 className="text-gradient" style={{ fontWeight: 800, margin: '0.75rem 0' }}>Delete Candidate?</h4>
            <p style={{ opacity: 0.65, fontSize: '0.88rem' }}>
              This will permanently delete the candidate and all associated votes.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button className="btn-glass" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg,var(--danger),#b91c1c)' }}
                onClick={handleDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
