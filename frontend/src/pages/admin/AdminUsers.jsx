// ─────────────────────────────────────────────
//  AdminUsers.jsx
// ─────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Spinner     from '../../components/Spinner'
import Alert       from '../../components/Alert'
import { adminAPI } from '../../services/api'

export default function AdminUsers() {
  const [users,      setUsers]      = useState([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('all')
  const [loading,    setLoading]    = useState(true)
  const [alert,      setAlert]      = useState({ type: '', msg: '' })
  const [deleteId,   setDeleteId]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await adminAPI.getUsers({ search, filter, page })
      setUsers(r.data.users || [])
      setTotal(r.data.total || 0)
      setTotalPages(r.data.totalPages || 1)
    } catch { setAlert({ type: 'error', msg: 'Failed to load users.' }) }
    finally  { setLoading(false) }
  }, [search, filter, page])

  useEffect(() => { load() }, [load])

  // Debounce search
  useEffect(() => { setPage(1) }, [search, filter])

  async function handleBlock(id) {
    try { await adminAPI.blockUser(id); setAlert({ type: 'success', msg: 'User blocked.' }); load() }
    catch { setAlert({ type: 'error', msg: 'Failed.' }) }
  }

  async function handleUnblock(id) {
    try { await adminAPI.unblockUser(id); setAlert({ type: 'success', msg: 'User unblocked.' }); load() }
    catch { setAlert({ type: 'error', msg: 'Failed.' }) }
  }

  async function handleDelete() {
    if (!deleteId) return
    try { await adminAPI.deleteUser(deleteId); setAlert({ type: 'success', msg: 'User deleted.' }); setDeleteId(null); load() }
    catch { setAlert({ type: 'error', msg: 'Failed to delete.' }) }
  }

  // Status helpers
  // status: 0=not voted, 1=voted, 2=blocked
  function statusBadge(u) {
    if (u.status === 2) return <span className="badge-danger">Blocked</span>
    if (u.status === 1) return <span className="badge-success">Voted ✓</span>
    return <span className="badge-warning">Not Voted</span>
  }

  return (
    <AdminLayout breadcrumb="Voters">
      {alert.msg && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert({ type: '', msg: '' })} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div className="text-gradient" style={{ fontSize: '1.3rem', fontWeight: 800 }}>Voters</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.55 }}>{total} registered voters</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div className="input-icon-wrapper" style={{ width: 220 }}>
            <i className="bi bi-search input-icon" />
            <input type="text" className="form-control-glass" placeholder="Search name / mobile..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Filter */}
          <select className="form-select-glass" style={{ width: 140 }} value={filter}
            onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="voted">Voted</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        {loading
          ? <Spinner message="Loading users..." />
          : users.length === 0
            ? <p style={{ textAlign: 'center', opacity: 0.5, padding: '3rem' }}>No users found.</p>
            : (
              <table className="table-glass">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>Voted For</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id}>
                      <td style={{ opacity: 0.5 }}>{(page - 1) * 15 + i + 1}</td>
                      <td>
                        <img src={`/uploads/${u.photo || 'default.png'}`} className="avatar" alt="" />
                      </td>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ fontFamily: 'monospace' }}>{u.mobile}</td>
                      <td style={{ opacity: 0.7 }}>{u.email || '—'}</td>
                      <td style={{ opacity: 0.7, fontSize: '0.82rem' }}>{u.voted_for || '—'}</td>
                      <td>{statusBadge(u)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap' }}>
                          {u.status === 2
                            ? (
                              <button className="btn-glass" title="Unblock"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', color: 'var(--success)' }}
                                onClick={() => handleUnblock(u.id)}>
                                <i className="bi bi-unlock-fill" />
                              </button>
                            ) : (
                              <button className="btn-glass" title="Block"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', color: 'var(--warning)' }}
                                onClick={() => handleBlock(u.id)}>
                                <i className="bi bi-lock-fill" />
                              </button>
                            )
                          }
                          <button className="btn-glass" title="Delete"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', color: 'var(--danger)' }}
                            onClick={() => setDeleteId(u.id)}>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button className="btn-glass" disabled={page === 1}
              style={{ padding: '0.4rem 0.8rem' }} onClick={() => setPage(p => p - 1)}>
              <i className="bi bi-chevron-left" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p}
                className={p === page ? 'btn-gradient' : 'btn-glass'}
                style={{ padding: '0.4rem 0.8rem', minWidth: 38 }}
                onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
            <button className="btn-glass" disabled={page === totalPages}
              style={{ padding: '0.4rem 0.8rem' }} onClick={() => setPage(p => p + 1)}>
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: 400, width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <h4 className="text-gradient" style={{ fontWeight: 800, margin: '0.75rem 0' }}>Delete User?</h4>
            <p style={{ opacity: 0.65, fontSize: '0.88rem' }}>
              This will permanently delete the voter and their vote record.
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
