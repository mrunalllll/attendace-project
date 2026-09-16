// ─────────────────────────────────────────────
//  VoterDashboard.jsx
//  Converted from: PHP routes/dashboard.php
//
//  PHP → React mapping:
//  - $_SESSION data          → useAuth() + API call
//  - PHP for loop candidates → candidates.map()
//  - PHP if/else vote button → conditional JSX rendering
//  - PHP status check        → hasVoted state
//  - JS confirm() vote       → Modal component with useState
//  - PHP countdown script    → useEffect + setInterval
// ─────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { Link }          from 'react-router-dom'
import { voterAPI }      from '../../services/api'
import { useAuth }       from '../../context/AuthContext'
import VoterNavbar       from '../../components/VoterNavbar'
import Alert             from '../../components/Alert'
import Spinner           from '../../components/Spinner'
import StatCard          from '../../components/StatCard'

// ── Countdown hook ────────────────────────────
function useCountdown(endDate) {
  const [time, setTime] = useState({})
  useEffect(() => {
    if (!endDate) return
    const tick = () => {
      const diff = new Date(endDate) - Date.now()
      if (diff <= 0) { setTime({ expired: true }); return }
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000)  / 60000),
        s: Math.floor((diff % 60000)    / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endDate])
  return time
}

export default function VoterDashboard() {
  // ── State ─────────────────────────────────
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [voting,     setVoting]     = useState(false)
  const [alert,      setAlert]      = useState({ type: '', msg: '' })
  const [search,     setSearch]     = useState('')
  const [modal,      setModal]      = useState(null)  // { id, name }

  const { user } = useAuth()

  // ── Fetch dashboard data (replaces PHP session + DB queries) ──
  const fetchData = useCallback(async () => {
    try {
      const res = await voterAPI.dashboard()
      setData(res.data)
    } catch {
      setAlert({ type: 'error', msg: 'Failed to load dashboard.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Countdown timer
  const countdown = useCountdown(data?.election?.end_date)

  // ── Vote submit (replaces PHP api/vote.php) ──
  async function submitVote() {
    if (!modal) return
    setVoting(true)
    setModal(null)
    try {
      const res = await voterAPI.vote(modal.id)
      setAlert({ type: 'success', msg: res.data.message })
      fetchData()   // refresh counts
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Voting failed.' })
    } finally {
      setVoting(false)
    }
  }

  // Filter candidates by search
  const filtered = (data?.candidates || []).filter(c =>
    `${c.name} ${c.party}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Spinner message="Loading dashboard..." />

  const { election, hasVoted, voteRow, total_votes, candidates = [], activities = [] } = data || {}
  const elecStatus = election?.election_status || 'pending'

  // ── JSX ───────────────────────────────────
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="blob blob-1" style={{ opacity: 0.04 }} />
      <div className="blob blob-2" style={{ opacity: 0.04 }} />

      <VoterNavbar />

      <div className="container-fluid" style={{ padding: '1.5rem' }}>

        {/* Flash alert */}
        {alert.msg && (
          <Alert type={alert.type} message={alert.msg} onClose={() => setAlert({ type:'', msg:'' })} />
        )}

        <div className="row g-4">

          {/* ── LEFT: Profile + Stats ── */}
          <div className="col-xl-3 col-lg-4">

            {/* Profile card */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', overflow: 'hidden', padding: 0 }}>
              <div style={{ height: 80, background: 'linear-gradient(135deg,var(--primary),var(--secondary))' }} />
              <div style={{ padding: '0 1.5rem 1.5rem', marginTop: -50 }}>
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={`/uploads/${data?.user?.photo || 'default.png'}`}
                    alt="profile"
                    className="avatar-xl"
                    style={{ border: '4px solid var(--bg)' }}
                  />
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '0.75rem' }}>
                    {data?.user?.name}
                  </div>
                  <span className="badge-gradient" style={{ fontSize: '0.68rem', marginTop: 4 }}>Voter</span>

                  {/* Profile stats row */}
                  <div style={{ display:'flex', justifyContent:'space-around', marginTop:'1.25rem',
                    paddingTop:'1.25rem', borderTop:'1px solid var(--border)' }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--primary-light)' }}>{candidates.length}</div>
                      <div style={{ fontSize:'0.7rem', opacity:0.5 }}>Candidates</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--primary-light)' }}>{total_votes}</div>
                      <div style={{ fontSize:'0.7rem', opacity:0.5 }}>Votes Cast</div>
                    </div>
                  </div>
                </div>

                <hr style={{ border:'none', borderTop:'1px solid var(--border)', margin:'1rem 0' }} />

                {/* Voter details */}
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', fontSize:'0.82rem' }}>
                  <div><i className="bi bi-phone me-2" style={{ opacity:0.5 }} />{data?.user?.mobile}</div>
                  {data?.user?.email && <div><i className="bi bi-envelope me-2" style={{ opacity:0.5 }} />{data.user.email}</div>}
                  <div><i className="bi bi-geo-alt me-2" style={{ opacity:0.5 }} />{data?.user?.address}</div>
                  <div style={{ marginTop:'0.25rem' }}>
                    <i className="bi bi-circle-fill me-2"
                      style={{ fontSize:'0.5rem', color: hasVoted ? 'var(--success)' : 'var(--danger)' }} />
                    Voting status:{' '}
                    {hasVoted
                      ? <span className="badge-success">Voted ✓</span>
                      : <span className="badge-danger">Not Voted</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Voted-for card */}
            {hasVoted && voteRow && (
              <div className="glass-card" style={{ padding:'1.25rem', marginBottom:'1.5rem' }}>
                <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'0.1em', opacity:0.5, marginBottom:'0.75rem' }}>
                  <i className="bi bi-check2-circle me-1" /> Your Vote
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <img src={`/uploads/${voteRow.cphoto || 'default.png'}`} className="avatar-lg" alt="" />
                  <div>
                    <div style={{ fontWeight:700 }}>{voteRow.cname}</div>
                    <div style={{ fontSize:'0.75rem', opacity:0.5 }}>{voteRow.party}</div>
                    <div style={{ fontSize:'0.72rem', opacity:0.4, marginTop:2 }}>
                      {new Date(voteRow.voted_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent activity */}
            <div className="glass-card" style={{ padding:'1.25rem' }}>
              <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase',
                letterSpacing:'0.1em', opacity:0.5, marginBottom:'0.75rem' }}>
                <i className="bi bi-clock-history me-1" /> Recent Activity
              </div>
              {activities.length === 0
                ? <p style={{ fontSize:'0.8rem', opacity:0.5 }}>No recent activity.</p>
                : activities.map((a, i) => (
                  <div key={i} style={{ fontSize:'0.8rem', marginBottom:'0.75rem' }}>
                    <div style={{ fontWeight:600 }}>{a.action}</div>
                    <div style={{ opacity:0.5, fontSize:'0.72rem' }}>
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* ── RIGHT: Election + Candidates ── */}
          <div className="col-xl-9 col-lg-8">

            {/* Election status banner */}
            {election && (
              <div className="glass-card" style={{ padding:'1rem 1.25rem', marginBottom:'1.5rem',
                display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                  <div className={`stat-icon ${elecStatus==='active'?'green':elecStatus==='ended'?'red':'orange'}`}>
                    <i className="bi bi-flag-fill" />
                  </div>
                  <div>
                    <div style={{ fontWeight:700 }}>{election.election_name}</div>
                    <div style={{ fontSize:'0.78rem', opacity:0.5 }}>
                      {elecStatus==='active'
                        ? <span className="badge-success">🟢 Election is LIVE</span>
                        : elecStatus==='ended'
                          ? <span className="badge-danger">🔴 Election Ended</span>
                          : <span className="badge-warning">🟡 Election Pending</span>
                      }
                    </div>
                  </div>
                </div>

                {/* Countdown timer (replaces PHP JS countdown) */}
                {elecStatus === 'active' && election.end_date && !countdown.expired && countdown.h !== undefined && (
                  <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                    {[['d','Days'],['h','Hrs'],['m','Min'],['s','Sec']].map(([k,lbl]) => (
                      <div key={k} className="countdown-item">
                        <div className="countdown-value">{String(countdown[k] ?? 0).padStart(2,'0')}</div>
                        <div className="countdown-label">{lbl}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats row */}
            <div className="row g-3" style={{ marginBottom:'1.5rem' }}>
              {[
                { icon:'bi-people-fill',    color:'blue',   value: candidates.length, label:'Total Candidates' },
                { icon:'bi-check2-all',     color:'green',  value: total_votes,        label:'Votes Cast' },
                { icon:'bi-person-check-fill',color:'purple',value: hasVoted?'✓':'✗',  label:'Your Status' },
                { icon:'bi-bar-chart-fill', color:'orange', value:
                  candidates.reduce((s,c)=>s+parseInt(c.vote_count||0),0)>0
                    ? Math.round((total_votes/candidates.reduce((s,c)=>s+parseInt(c.vote_count||0),0))*100)+'%'
                    : '0%',
                  label:'Turnout' },
              ].map(s => (
                <div key={s.label} className="col-6 col-xl-3">
                  <StatCard {...s} />
                </div>
              ))}
            </div>

            {/* Candidates grid */}
            <div className="glass-card" style={{ padding:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
                <div>
                  <div style={{ fontSize:'1.1rem', fontWeight:800 }} className="text-gradient">Candidates</div>
                  <div style={{ fontSize:'0.8rem', opacity:0.55 }}>Cast your vote for your preferred candidate</div>
                </div>
                {/* Search (replaces PHP no-search → React live filter) */}
                <div className="input-icon-wrapper" style={{ width: 260 }}>
                  <i className="bi bi-search input-icon" />
                  <input
                    type="text"
                    className="form-control-glass"
                    placeholder="Search candidates..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {elecStatus !== 'active' && !hasVoted && (
                <Alert type="warning"
                  message={elecStatus==='pending'
                    ? 'Election has not started yet. Voting will open soon.'
                    : 'Election has ended. No more votes can be cast.'} />
              )}

              {filtered.length === 0
                ? <div style={{ textAlign:'center', padding:'3rem', opacity:0.4 }}>
                    <i className="bi bi-person-x" style={{ fontSize:'3rem' }} />
                    <p style={{ marginTop:'0.75rem' }}>No candidates found.</p>
                  </div>
                : (
                  <div className="row g-4">
                    {/* Replaces PHP for loop over $groups */}
                    {filtered.map((c, i) => {
                      const isVotedFor = hasVoted && voteRow?.candidate_id === c.id
                      return (
                        <div key={c.id} className="col-sm-6 col-xl-4">
                          <div className="candidate-card">
                            {i === 0 && !hasVoted && <div className="card-ribbon">Leading</div>}
                            <div className="card-img-wrap">
                              <img src={`/uploads/${c.photo || 'default.png'}`} alt={c.name} />
                              <div className="rank-badge">#{i+1} Rank</div>
                            </div>
                            <div style={{ padding:'1.25rem' }}>
                              <div style={{ fontWeight:700, fontSize:'1rem' }}>{c.name}</div>
                              <div style={{ fontSize:'0.78rem', opacity:0.6, display:'flex', alignItems:'center', gap:4 }}>
                                <i className="bi bi-building" />{c.party}
                              </div>
                              {c.manifesto && (
                                <p style={{ fontSize:'0.75rem', opacity:0.55, marginTop:'0.4rem',
                                  overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2,
                                  WebkitBoxOrient:'vertical' }}>
                                  {c.manifesto}
                                </p>
                              )}
                              {/* Vote progress bar */}
                              <div style={{ marginTop:'0.75rem' }}>
                                <div style={{ display:'flex', justifyContent:'space-between',
                                  fontSize:'0.75rem', fontWeight:600, marginBottom:4 }}>
                                  <span>{c.vote_count} votes</span>
                                  <span>{c.pct}%</span>
                                </div>
                                <div className="progress-glass">
                                  <div className="progress-fill" style={{ width:`${c.pct}%` }} />
                                </div>
                              </div>

                              {/* Vote button — replaces PHP if/else */}
                              {isVotedFor ? (
                                <button className="btn-gradient" disabled
                                  style={{ width:'100%', marginTop:'0.75rem', justifyContent:'center',
                                    background:'linear-gradient(135deg,var(--success),#059669)' }}>
                                  ✓ You Voted Here
                                </button>
                              ) : hasVoted ? (
                                <button className="btn-glass" disabled
                                  style={{ width:'100%', marginTop:'0.75rem', justifyContent:'center', opacity:0.5 }}>
                                  Already Voted
                                </button>
                              ) : elecStatus === 'active' ? (
                                <button
                                  className="btn-gradient"
                                  style={{ width:'100%', marginTop:'0.75rem', justifyContent:'center' }}
                                  onClick={() => setModal({ id: c.id, name: c.name })}
                                  disabled={voting}
                                >
                                  <i className="bi bi-hand-thumbs-up me-1" /> Vote
                                </button>
                              ) : (
                                <button className="btn-glass" disabled
                                  style={{ width:'100%', marginTop:'0.75rem', justifyContent:'center', opacity:0.5 }}>
                                  Voting Closed
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── Vote Confirmation Modal (replaces PHP JS confirm()) ── */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999,
          backdropFilter:'blur(6px)', padding:'1rem' }}>
          <div className="glass-card" style={{ maxWidth:420, width:'100%', padding:'2rem', textAlign:'center' }}>
            <div style={{ fontSize:'3rem' }}>🗳️</div>
            <h4 className="text-gradient" style={{ fontWeight:800, marginTop:'0.75rem' }}>
              Confirm Your Vote
            </h4>
            <p style={{ fontSize:'0.9rem', opacity:0.7, margin:'0.75rem 0' }}>
              You are about to vote for:
            </p>
            <h3 className="text-gradient" style={{ fontWeight:800 }}>{modal.name}</h3>
            <p style={{ fontSize:'0.8rem', opacity:0.55, marginTop:'0.75rem' }}>
              <i className="bi bi-exclamation-triangle me-1" />
              This action cannot be undone. Your vote is final.
            </p>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', marginTop:'1.5rem' }}>
              <button className="btn-glass" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-gradient" onClick={submitVote} disabled={voting}>
                {voting ? 'Submitting...' : 'Confirm Vote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
