// ─────────────────────────────────────────────
//  AdminElection.jsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Spinner     from '../../components/Spinner'
import Alert       from '../../components/Alert'
import { adminAPI } from '../../services/api'

export default function AdminElection() {
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [alert,      setAlert]      = useState({ type: '', msg: '' })
  const [confirmAct, setConfirmAct] = useState(null) // action string pending confirm
  const [settings,   setSettings]   = useState({ election_name: '', start_date: '', end_date: '', allow_registration: false })

  async function load() {
    try {
      const r = await adminAPI.getElection()
      setData(r.data)
      const e = r.data.election
      if (e) {
        setSettings({
          election_name:      e.election_name     || '',
          start_date:         e.start_date        ? e.start_date.slice(0, 16)  : '',
          end_date:           e.end_date          ? e.end_date.slice(0, 16)    : '',
          allow_registration: !!e.allow_registration,
        })
      }
    } catch { setAlert({ type: 'error', msg: 'Failed to load election data.' }) }
    finally  { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function saveSettings(e) {
    e.preventDefault(); setSaving(true)
    try {
      const r = await adminAPI.electionAction({ action: 'update_settings', ...settings })
      setAlert({ type: 'success', msg: r.data.message }); load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed.' })
    } finally { setSaving(false) }
  }

  async function doAction(action) {
    setConfirmAct(null); setActionBusy(true)
    try {
      const r = await adminAPI.electionAction({ action })
      setAlert({ type: 'success', msg: r.data.message }); load()
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Action failed.' })
    } finally { setActionBusy(false) }
  }

  if (loading) return <AdminLayout breadcrumb="Election"><Spinner message="Loading..." /></AdminLayout>

  const election  = data?.election
  const elecStatus = election?.election_status || 'pending'
  const candidates = data?.candidates || []

  // Confirm dialog messages
  const confirmMessages = {
    start:          { icon: '🗳️', title: 'Start Election?',      msg: 'This will open voting to all registered voters.',        btn: 'btn-gradient', label: 'Start Election' },
    end:            { icon: '🔴', title: 'End Election?',         msg: 'Voting will be closed. This cannot be undone.',           btn: 'btn-gradient', label: 'End Election', danger: true },
    declare_winner: { icon: '🏆', title: 'Declare Winner?',       msg: 'The candidate with most votes will be declared winner.',  btn: 'btn-gradient', label: 'Declare Winner' },
    reset:          { icon: '⚠️', title: 'Reset Election?',       msg: 'ALL votes will be permanently deleted. Are you sure?',   btn: 'btn-gradient', label: 'Yes, Reset', danger: true },
  }

  return (
    <AdminLayout breadcrumb="Election">
      {alert.msg && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert({ type: '', msg: '' })} />}

      <div className="row g-4">
        {/* Settings form */}
        <div className="col-lg-6">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="text-gradient" style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
              <i className="bi bi-gear-fill me-2" />Election Settings
            </div>
            <form onSubmit={saveSettings}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label">Election Name</label>
                  <input className="form-control-glass" placeholder="e.g. General Election 2025"
                    value={settings.election_name}
                    onChange={e => setSettings(s => ({ ...s, election_name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Start Date &amp; Time</label>
                  <input type="datetime-local" className="form-control-glass"
                    value={settings.start_date}
                    onChange={e => setSettings(s => ({ ...s, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">End Date &amp; Time</label>
                  <input type="datetime-local" className="form-control-glass"
                    value={settings.end_date}
                    onChange={e => setSettings(s => ({ ...s, end_date: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="allow_reg" style={{ accentColor: 'var(--primary)' }}
                    checked={settings.allow_registration}
                    onChange={e => setSettings(s => ({ ...s, allow_registration: e.target.checked }))} />
                  <label htmlFor="allow_reg" style={{ cursor: 'pointer', fontSize: '0.88rem' }}>
                    Allow voter registration
                  </label>
                </div>
                <button type="submit" className="btn-gradient" disabled={saving}>
                  {saving ? 'Saving...' : <><i className="bi bi-save-fill me-1" />Save Settings</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Controls */}
        <div className="col-lg-6">
          {/* Status card */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="text-gradient" style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem' }}>
              <i className="bi bi-flag-fill me-2" />Current Status
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div className={`stat-icon ${elecStatus === 'active' ? 'green' : elecStatus === 'ended' ? 'red' : 'orange'}`}
                style={{ width: 48, height: 48 }}>
                <i className={`bi ${elecStatus === 'active' ? 'bi-play-circle-fill' : elecStatus === 'ended' ? 'bi-stop-circle-fill' : 'bi-pause-circle-fill'}`} />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{election?.election_name || 'Election'}</div>
                <div style={{ fontSize: '0.8rem' }}>
                  {elecStatus === 'active'
                    ? <span className="badge-success">🟢 LIVE</span>
                    : elecStatus === 'ended'
                      ? <span className="badge-danger">🔴 Ended</span>
                      : <span className="badge-warning">🟡 Pending</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              <div style={{ opacity: 0.65 }}><i className="bi bi-people-fill me-1" />{data?.total_users} voters</div>
              <div style={{ opacity: 0.65 }}><i className="bi bi-check2-all me-1" />{data?.total_votes} votes cast</div>
              <div style={{ opacity: 0.65 }}><i className="bi bi-person-check-fill me-1" />{data?.voted_users} voted</div>
              <div style={{ opacity: 0.65 }}><i className="bi bi-bar-chart-fill me-1" />
                {data?.total_users > 0 ? Math.round((data?.voted_users / data?.total_users) * 100) : 0}% turnout
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="text-gradient" style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem' }}>
              <i className="bi bi-lightning-fill me-2" />Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {elecStatus === 'pending' && (
                <button className="btn-gradient" disabled={actionBusy} onClick={() => setConfirmAct('start')}>
                  <i className="bi bi-play-fill" /> Start Election
                </button>
              )}
              {elecStatus === 'active' && (
                <button className="btn-gradient" style={{ background: 'linear-gradient(135deg,var(--danger),#b91c1c)' }}
                  disabled={actionBusy} onClick={() => setConfirmAct('end')}>
                  <i className="bi bi-stop-fill" /> End Election
                </button>
              )}
              {elecStatus === 'ended' && !election?.winner_declared && (
                <button className="btn-gradient" style={{ background: 'linear-gradient(135deg,var(--warning),#d97706)' }}
                  disabled={actionBusy} onClick={() => setConfirmAct('declare_winner')}>
                  <i className="bi bi-trophy-fill" /> Declare Winner
                </button>
              )}
              <button className="btn-glass" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                disabled={actionBusy} onClick={() => setConfirmAct('reset')}>
                <i className="bi bi-arrow-counterclockwise" /> Reset Election (Clear All Votes)
              </button>
            </div>
          </div>

          {/* Winner banner */}
          {election?.winner_declared && data?.winner && (
            <div className="winner-card" style={{ marginTop: '1.5rem' }}>
              <div className="winner-crown">🏆</div>
              <div className="text-gradient" style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: '0.5rem' }}>
                {data.winner.name}
              </div>
              <div style={{ opacity: 0.6 }}>{data.winner.party}</div>
              <div className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>
                {data.winner.vc} votes
              </div>
            </div>
          )}
        </div>

        {/* Candidate standings */}
        <div className="col-12">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="text-gradient" style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
              Current Standings
            </div>
            {candidates.length === 0
              ? <p style={{ opacity: 0.5 }}>No candidates yet.</p>
              : candidates.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="text-gradient" style={{ width: 28, fontWeight: 800 }}>#{i + 1}</div>
                  <img src={`/uploads/${c.photo || 'default.png'}`} className="avatar" alt="" />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{c.name} <small style={{ opacity: 0.5 }}>{c.party}</small></span>
                      <span style={{ fontWeight: 700 }}>{c.vc} votes</span>
                    </div>
                    <div className="progress-glass">
                      <div className="progress-fill" style={{ width: `${data?.total_votes > 0 ? Math.round((c.vc / data.total_votes) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Confirm action modal */}
      {confirmAct && confirmMessages[confirmAct] && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: 420, width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>{confirmMessages[confirmAct].icon}</div>
            <h4 className="text-gradient" style={{ fontWeight: 800, margin: '0.75rem 0' }}>
              {confirmMessages[confirmAct].title}
            </h4>
            <p style={{ opacity: 0.65, fontSize: '0.88rem' }}>{confirmMessages[confirmAct].msg}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button className="btn-glass" onClick={() => setConfirmAct(null)}>Cancel</button>
              <button className={confirmMessages[confirmAct].btn}
                style={confirmMessages[confirmAct].danger ? { background: 'linear-gradient(135deg,var(--danger),#b91c1c)' } : {}}
                onClick={() => doAction(confirmAct)}>
                {confirmMessages[confirmAct].label}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
