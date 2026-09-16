// ─────────────────────────────────────────────
//  AdminLogs.jsx
// ─────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Spinner     from '../../components/Spinner'
import Alert       from '../../components/Alert'
import { adminAPI } from '../../services/api'

export default function AdminLogs() {
  const [logs,        setLogs]        = useState([])
  const [total,       setTotal]       = useState(0)
  const [totalPages,  setTotalPages]  = useState(1)
  const [page,        setPage]        = useState(1)
  const [search,      setSearch]      = useState('')
  const [actionFilter,setActionFilter]= useState('')
  const [actionTypes, setActionTypes] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [alert,       setAlert]       = useState({ type: '', msg: '' })
  const [confirmClear,setConfirmClear]= useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await adminAPI.getLogs({ search, action_filter: actionFilter, page })
      setLogs(r.data.logs || [])
      setTotal(r.data.total || 0)
      setTotalPages(r.data.totalPages || 1)
      setActionTypes(r.data.action_types || [])
    } catch { setAlert({ type: 'error', msg: 'Failed to load logs.' }) }
    finally  { setLoading(false) }
  }, [search, actionFilter, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, actionFilter])

  async function handleClear() {
    setConfirmClear(false)
    try {
      await adminAPI.clearLogs()
      setAlert({ type: 'success', msg: 'All logs cleared.' }); load()
    } catch { setAlert({ type: 'error', msg: 'Failed to clear logs.' }) }
  }

  // Badge colour per action type
  function actionBadge(action) {
    const lower = action?.toLowerCase() || ''
    if (lower.includes('login'))    return <span className="badge-success">{action}</span>
    if (lower.includes('logout'))   return <span className="badge-info">{action}</span>
    if (lower.includes('block'))    return <span className="badge-danger">{action}</span>
    if (lower.includes('delete'))   return <span className="badge-danger">{action}</span>
    if (lower.includes('reset'))    return <span className="badge-danger">{action}</span>
    if (lower.includes('add') || lower.includes('register')) return <span className="badge-success">{action}</span>
    if (lower.includes('vote'))     return <span className="badge-gradient">{action}</span>
    if (lower.includes('winner'))   return <span className="badge-warning">{action}</span>
    return <span className="badge-info">{action}</span>
  }

  return (
    <AdminLayout breadcrumb="Activity Logs">
      {alert.msg && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert({ type: '', msg: '' })} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div className="text-gradient" style={{ fontSize: '1.3rem', fontWeight: 800 }}>Activity Logs</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.55 }}>{total} total log entries</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div className="input-icon-wrapper" style={{ width: 220 }}>
            <i className="bi bi-search input-icon" />
            <input type="text" className="form-control-glass" placeholder="Search user / action..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Action filter */}
          <select className="form-select-glass" style={{ width: 160 }} value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}>
            <option value="">All Actions</option>
            {actionTypes.map(a => (
              <option key={a.action} value={a.action}>{a.action}</option>
            ))}
          </select>
          <button className="btn-glass" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
            onClick={() => setConfirmClear(true)}>
            <i className="bi bi-trash3-fill" /> Clear All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        {loading
          ? <Spinner message="Loading logs..." />
          : logs.length === 0
            ? <p style={{ textAlign: 'center', opacity: 0.5, padding: '3rem' }}>No logs found.</p>
            : (
              <table className="table-glass">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>IP Address</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id}>
                      <td style={{ opacity: 0.4 }}>{(page - 1) * 20 + i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={`/uploads/${log.uphoto || 'default.png'}`} className="avatar"
                            style={{ width: 28, height: 28 }} alt="" />
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.uname || 'System'}</span>
                        </div>
                      </td>
                      <td>{actionBadge(log.action)}</td>
                      <td style={{ opacity: 0.7, fontSize: '0.82rem', maxWidth: 260 }}>{log.description || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', opacity: 0.6 }}>
                        {log.ip_address || '—'}
                      </td>
                      <td style={{ opacity: 0.55, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
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
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              // Show pages around current
              const half = 3
              let start = Math.max(1, page - half)
              const end = Math.min(totalPages, start + 6)
              start = Math.max(1, end - 6)
              return start + i
            }).filter(p => p <= totalPages).map(p => (
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

      {/* Clear confirm modal */}
      {confirmClear && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: 400, width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🗑️</div>
            <h4 className="text-gradient" style={{ fontWeight: 800, margin: '0.75rem 0' }}>Clear All Logs?</h4>
            <p style={{ opacity: 0.65, fontSize: '0.88rem' }}>
              This will permanently delete all activity log entries.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button className="btn-glass" onClick={() => setConfirmClear(false)}>Cancel</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg,var(--danger),#b91c1c)' }}
                onClick={handleClear}>
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
