// ─────────────────────────────────────────────
//  VoterDashboard.jsx — Homepage + Voting
//  Existing voting system preserved.
//  Added: Announcements, Upcoming Events, Departments, Gallery sections
// ─────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { voterAPI, eventsAPI, galleryAPI, announcementsAPI, authAPI, departmentsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import VoterNavbar from '../../components/VoterNavbar'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'
import StatCard from '../../components/StatCard'

const CAT_COLORS = {
  Freshers:'#06b6d4', Farewell:'#7c3aed', Workshop:'#f59e0b',
  Seminar:'#3b82f6', Hackathon:'#ef4444', Technical:'#10b981',
  Cultural:'#f97316', Sports:'#84cc16', Fest:'#ec4899', Other:'#6b7280',
}

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
  // ── Voting state (unchanged) ──────────────
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [voting,  setVoting]  = useState(false)
  const [alert,   setAlert]   = useState({ type: '', msg: '' })
  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState(null)

  // ── College data state ────────────────────
  const [upcomingEvents,  setUpcoming]    = useState([])
  const [departments,     setDepts]       = useState([])
  const [featuredGallery, setFeatGallery] = useState([])
  const [announcements,   setAnn]         = useState([])
  const [lbIdx,           setLbIdx]       = useState(null)
  // Department change
  const [deptModal,       setDeptModal]   = useState(false)
  const [selectedDept,    setSelectedDept]= useState('')
  const [deptSaving,      setDeptSaving]  = useState(false)

  const { user, setUser } = useAuth()

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

  useEffect(() => {
    fetchData()
    // College data — non-blocking, fail silently
    eventsAPI.getUpcoming().then(r => setUpcoming(r.data.events || [])).catch(() => {})
    departmentsAPI.getAll().then(r => setDepts((r.data.departments || []).slice(0, 8))).catch(() => {})
    galleryAPI.getFeatured().then(r => setFeatGallery((r.data.images || []).slice(0, 8))).catch(() => {})
    announcementsAPI.getLatest().then(r => setAnn(r.data.announcements || [])).catch(() => {})
  }, [fetchData])

  const countdown = useCountdown(data?.election?.end_date)

  async function submitVote() {
    if (!modal) return
    setVoting(true)
    setModal(null)
    try {
      const res = await voterAPI.vote(modal.id)
      setAlert({ type: 'success', msg: res.data.message })
      fetchData()
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Voting failed.' })
    } finally {
      setVoting(false)
    }
  }

  const filtered = (data?.candidates || []).filter(c =>
    `${c.name} ${c.party}`.toLowerCase().includes(search.toLowerCase())
  )

  async function saveDept() {
    if (!selectedDept) return
    setDeptSaving(true)
    try {
      await authAPI.updateDepartment(parseInt(selectedDept))
      // Update user context so header/profile reflects new dept immediately
      setUser(u => ({ ...u, department_id: parseInt(selectedDept) }))
      setAlert({ type: 'success', msg: 'Department updated successfully.' })
      setDeptModal(false)
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to update department.' })
    } finally {
      setDeptSaving(false)
    }
  }

  if (loading) return <Spinner message="Loading dashboard..." />

  const { election, hasVoted, voteRow, total_votes, candidates = [], activities = [] } = data || {}
  const elecStatus = election?.election_status || 'pending'

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 64 }}>
      <div className="blob blob-1" style={{ opacity: 0.04 }} />
      <div className="blob blob-2" style={{ opacity: 0.04 }} />

      <VoterNavbar />

      <div className="container-fluid" style={{ padding: '1.5rem', maxWidth: 1400 }}>

        {alert.msg && (
          <Alert type={alert.type} message={alert.msg} onClose={() => setAlert({ type:'', msg:'' })} />
        )}

        {/* ── ANNOUNCEMENTS TICKER ── */}
        {announcements.length > 0 && (
          <div className="glass-card mb-4 p-0 overflow-hidden">
            <div className="d-flex" style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{ background: 'linear-gradient(135deg,var(--primary),var(--secondary))', padding: '8px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
                <i className="bi bi-megaphone-fill"></i>
                <span className="d-none d-sm-inline">NOTICES</span>
              </div>
              <div style={{ overflowX: 'auto', display: 'flex', gap: 0, flexGrow: 1 }}>
                {announcements.map(a => (
                  <div key={a.id} className={`ann-banner ${a.type}`} style={{ borderRadius: 0, borderLeft: 'none', borderBottom: 'none', borderTop: 'none', padding: '8px 20px', whiteSpace: 'nowrap', flexShrink: 0, borderRight: '1px solid var(--border)' }}>
                    {a.is_pinned === 1 && <span style={{ marginRight: 6 }}>📌</span>}
                    <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{a.title}</span>
                    {a.dept_name && <span style={{ marginLeft: 8, opacity: 0.55, fontSize: '0.75rem' }}>— {a.dept_name}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="row g-4">

          {/* ── LEFT: Profile + Quick Nav ── */}
          <div className="col-xl-3 col-lg-4">

            {/* Profile card */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', overflow: 'hidden', padding: 0 }}>
              <div style={{ height: 80, background: 'linear-gradient(135deg,var(--primary),var(--secondary))' }} />
              <div style={{ padding: '0 1.5rem 1.5rem', marginTop: -50 }}>
                <div style={{ textAlign: 'center' }}>
                  <img src={`/uploads/${data?.user?.photo || 'default.png'}`} alt="profile" className="avatar-xl" style={{ border: '4px solid var(--bg)' }} />
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '0.75rem' }}>{data?.user?.name}</div>
                  <span className="badge-gradient" style={{ fontSize: '0.68rem', marginTop: 4 }}>Student</span>
                  <div style={{ display:'flex', justifyContent:'space-around', marginTop:'1.25rem', paddingTop:'1.25rem', borderTop:'1px solid var(--border)' }}>
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
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', fontSize:'0.82rem' }}>
                  <div><i className="bi bi-phone me-2" style={{ opacity:0.5 }} />{data?.user?.mobile}</div>
                  {data?.user?.email && <div><i className="bi bi-envelope me-2" style={{ opacity:0.5 }} />{data.user.email}</div>}
                  <div><i className="bi bi-geo-alt me-2" style={{ opacity:0.5 }} />{data?.user?.address}</div>
                  <div style={{ marginTop:'0.25rem' }}>
                    <i className="bi bi-circle-fill me-2" style={{ fontSize:'0.5rem', color: hasVoted ? 'var(--success)' : 'var(--danger)' }} />
                    Voting: {hasVoted ? <span className="badge-success">Voted ✓</span> : <span className="badge-danger">Not Voted</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Voted-for card */}
            {hasVoted && voteRow && (
              <div className="glass-card" style={{ padding:'1.25rem', marginBottom:'1.5rem' }}>
                <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', opacity:0.5, marginBottom:'0.75rem' }}>
                  <i className="bi bi-check2-circle me-1" /> Your Vote
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <img src={`/uploads/${voteRow.cphoto || 'default.png'}`} className="avatar-lg" alt="" />
                  <div>
                    <div style={{ fontWeight:700 }}>{voteRow.cname}</div>
                    <div style={{ fontSize:'0.75rem', opacity:0.5 }}>{voteRow.party}</div>
                    <div style={{ fontSize:'0.72rem', opacity:0.4, marginTop:2 }}>{new Date(voteRow.voted_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick nav */}
            <div className="glass-card p-3 mb-4">
              <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', opacity:0.5, marginBottom:'0.75rem' }}>Explore</div>
              {[
                { to:'/events',      icon:'bi-calendar-event-fill', color:'#7c3aed', label:'Events' },
                { to:'/gallery',     icon:'bi-images',              color:'#06b6d4', label:'Gallery' },
                { to:'/search',      icon:'bi-search',              color:'#10b981', label:'Search' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="voter-nav-link d-flex mb-1"
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 6px', textDecoration:'none', color:'var(--text)', borderRadius:8 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${l.color}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className={`bi ${l.icon}`} style={{ color:l.color, fontSize:14 }}></i>
                  </div>
                  <span style={{ fontSize:'0.85rem', fontWeight:600 }}>{l.label}</span>
                  <i className="bi bi-chevron-right ms-auto" style={{ fontSize:11, opacity:0.35 }}></i>
                </Link>
              ))}
            </div>

            {/* Recent activity */}
            <div className="glass-card" style={{ padding:'1.25rem' }}>
              <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', opacity:0.5, marginBottom:'0.75rem' }}>
                <i className="bi bi-clock-history me-1" /> Recent Activity
              </div>
              {activities.length === 0
                ? <p style={{ fontSize:'0.8rem', opacity:0.5 }}>No recent activity.</p>
                : activities.map((a, i) => (
                  <div key={i} style={{ fontSize:'0.8rem', marginBottom:'0.75rem' }}>
                    <div style={{ fontWeight:600 }}>{a.action}</div>
                    <div style={{ opacity:0.5, fontSize:'0.72rem' }}>{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                ))
              }
            </div>

            {/* Department card */}
            {(() => {
              const myDept = departments.find(d => d.id === (user?.department_id))
              return (
                <div className="glass-card" style={{ padding:'1.25rem', marginTop:'1.5rem' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
                    <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', opacity:0.5 }}>
                      <i className="bi bi-building-fill me-1" /> My Department
                    </div>
                    <button className="btn-glass" style={{ fontSize:'0.72rem', padding:'3px 10px' }}
                      onClick={() => { setSelectedDept(user?.department_id || ''); setDeptModal(true) }}>
                      <i className="bi bi-pencil-fill me-1" /> Change
                    </button>
                  </div>
                  {myDept ? (
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,var(--primary),var(--secondary))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {myDept.image
                          ? <img src={`/uploads/${myDept.image}`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }} />
                          : <i className="bi bi-building text-white"></i>}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'0.88rem' }}>{myDept.name}</div>
                        <div style={{ fontSize:'0.72rem', opacity:0.5 }}>{myDept.code}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize:'0.82rem', opacity:0.5 }}>No department set.</div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* ── RIGHT: Election + College Sections ── */}
          <div className="col-xl-9 col-lg-8">

            {/* Election status banner */}
            {election && (
              <div className="glass-card" style={{ padding:'1rem 1.25rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
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
                          : <span className="badge-warning">🟡 Election Pending</span>}
                    </div>
                  </div>
                </div>
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

            {/* Stats */}
            <div className="row g-3" style={{ marginBottom:'1.5rem' }}>
              {[
                { icon:'bi-people-fill',      color:'blue',   value: candidates.length,  label:'Total Candidates' },
                { icon:'bi-check2-all',        color:'green',  value: total_votes,         label:'Votes Cast' },
                { icon:'bi-person-check-fill', color:'purple', value: hasVoted?'✓':'✗',    label:'Your Status' },
                { icon:'bi-calendar-event-fill',color:'cyan',  value: upcomingEvents.length, label:'Upcoming Events' },
              ].map(s => (
                <div key={s.label} className="col-6 col-xl-3">
                  <StatCard {...s} />
                </div>
              ))}
            </div>

            {/* ── UPCOMING EVENTS ── */}
            {upcomingEvents.length > 0 && (
              <div className="glass-card p-4 mb-4">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                  <div>
                    <h6 className="text-gradient fw-bold mb-0"><i className="bi bi-calendar-event-fill me-2"></i>Upcoming Events</h6>
                    <p style={{ fontSize:'0.78rem', opacity:0.5, margin:0 }}>Don't miss these events</p>
                  </div>
                  <Link to="/events" className="btn-glass" style={{ fontSize:'0.78rem', padding:'0.35rem 0.9rem' }}>View All</Link>
                </div>
                <div className="row g-3">
                  {upcomingEvents.slice(0,4).map(ev => (
                    <div key={ev.id} className="col-sm-6">
                      <Link to={`/events/${ev.slug}`} className="d-flex gap-3 text-decoration-none align-items-start glass-card p-3 hover-lift" style={{ color:'var(--text)', border:'1px solid var(--border)' }}>
                        <div style={{ width:56, height:56, borderRadius:10, background:`linear-gradient(135deg,${CAT_COLORS[ev.category]||'#4f46e5'},#7c3aed)`, overflow:'hidden', flexShrink:0 }}>
                          {ev.poster && <img src={`/uploads/${ev.poster}`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:'0.88rem', lineHeight:1.3, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</div>
                          <div style={{ fontSize:'0.75rem', opacity:0.5, marginBottom:2 }}><i className="bi bi-building me-1"></i>{ev.dept_name || 'General'}</div>
                          {ev.event_date && <div style={{ fontSize:'0.72rem', opacity:0.5 }}><i className="bi bi-calendar3 me-1"></i>{new Date(ev.event_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>}
                        </div>
                        <span style={{ flexShrink:0, background:CAT_COLORS[ev.category]||'#6b7280', color:'#fff', padding:'2px 8px', borderRadius:20, fontSize:'0.65rem', fontWeight:700 }}>{ev.category}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── VOTING / CANDIDATES (UNCHANGED) ── */}
            <div className="glass-card" style={{ padding:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
                <div>
                  <div style={{ fontSize:'1.1rem', fontWeight:800 }} className="text-gradient">
                    <i className="bi bi-flag-fill me-2"></i>Candidates
                  </div>
                  <div style={{ fontSize:'0.8rem', opacity:0.55 }}>Cast your vote for your preferred candidate</div>
                </div>
                <div className="input-icon-wrapper" style={{ width: 260 }}>
                  <i className="bi bi-search input-icon" />
                  <input type="text" className="form-control-glass" placeholder="Search candidates..."
                    value={search} onChange={e => setSearch(e.target.value)} />
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
                                <p style={{ fontSize:'0.75rem', opacity:0.55, marginTop:'0.4rem', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                                  {c.manifesto}
                                </p>
                              )}
                              <div style={{ marginTop:'0.75rem' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', fontWeight:600, marginBottom:4 }}>
                                  <span>{c.vote_count} votes</span>
                                  <span>{c.pct}%</span>
                                </div>
                                <div className="progress-glass">
                                  <div className="progress-fill" style={{ width:`${c.pct}%` }} />
                                </div>
                              </div>
                              {isVotedFor ? (
                                <button className="btn-gradient" disabled style={{ width:'100%', marginTop:'0.75rem', justifyContent:'center', background:'linear-gradient(135deg,var(--success),#059669)' }}>
                                  ✓ You Voted Here
                                </button>
                              ) : hasVoted ? (
                                <button className="btn-glass" disabled style={{ width:'100%', marginTop:'0.75rem', justifyContent:'center', opacity:0.5 }}>
                                  Already Voted
                                </button>
                              ) : elecStatus === 'active' ? (
                                <button className="btn-gradient" style={{ width:'100%', marginTop:'0.75rem', justifyContent:'center' }}
                                  onClick={() => setModal({ id: c.id, name: c.name })} disabled={voting}>
                                  <i className="bi bi-hand-thumbs-up me-1" /> Vote
                                </button>
                              ) : (
                                <button className="btn-glass" disabled style={{ width:'100%', marginTop:'0.75rem', justifyContent:'center', opacity:0.5 }}>
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

            {/* ── FEATURED GALLERY ── */}
            {featuredGallery.length > 0 && (
              <div className="glass-card p-4 mt-4">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                  <div>
                    <h6 className="text-gradient fw-bold mb-0"><i className="bi bi-images me-2"></i>College Gallery</h6>
                    <p style={{ fontSize:'0.78rem', opacity:0.5, margin:0 }}>Campus life &amp; memories</p>
                  </div>
                  <Link to="/gallery" className="btn-glass" style={{ fontSize:'0.78rem', padding:'0.35rem 0.9rem' }}>View All</Link>
                </div>
                <div className="row g-2">
                  {featuredGallery.map((img, i) => (
                    <div key={img.id} className="col-6 col-md-4 col-lg-3">
                      <div onClick={() => setLbIdx(i)}
                        style={{ aspectRatio:'1', borderRadius:10, overflow:'hidden', cursor:'pointer', transition:'transform 0.2s' }}
                        className="photo-grid-item">
                        <img src={`/uploads/${img.photo}`} alt={img.title || ''} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Department Change Modal (voter only) ── */}
      {deptModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(6px)', padding:'1rem' }}>
          <div className="glass-card" style={{ maxWidth:420, width:'100%', padding:'2rem' }}>
            <h4 className="text-gradient" style={{ fontWeight:800, marginBottom:'0.5rem' }}>
              <i className="bi bi-building-fill me-2" />Change Department
            </h4>
            <p style={{ fontSize:'0.83rem', opacity:0.6, marginBottom:'1.25rem' }}>
              Select your current department. This is saved to your profile.
            </p>
            <select className="form-select-glass" value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              style={{ marginBottom:'1.25rem' }}>
              <option value="">— Select department —</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <button className="btn-glass" onClick={() => setDeptModal(false)}>Cancel</button>
              <button className="btn-gradient" onClick={saveDept} disabled={deptSaving || !selectedDept}>
                {deptSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Vote Confirmation Modal (unchanged) ── */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(6px)', padding:'1rem' }}>
          <div className="glass-card" style={{ maxWidth:420, width:'100%', padding:'2rem', textAlign:'center' }}>
            <div style={{ fontSize:'3rem' }}>🗳️</div>
            <h4 className="text-gradient" style={{ fontWeight:800, marginTop:'0.75rem' }}>Confirm Your Vote</h4>
            <p style={{ fontSize:'0.9rem', opacity:0.7, margin:'0.75rem 0' }}>You are about to vote for:</p>
            <h3 className="text-gradient" style={{ fontWeight:800 }}>{modal.name}</h3>
            <p style={{ fontSize:'0.8rem', opacity:0.55, marginTop:'0.75rem' }}>
              <i className="bi bi-exclamation-triangle me-1" />This action cannot be undone. Your vote is final.
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

      {/* Gallery lightbox */}
      {lbIdx !== null && (
        <div className="lightbox-backdrop" onClick={() => setLbIdx(null)}>
          <img src={`/uploads/${featuredGallery[lbIdx]?.photo}`} className="lightbox-img" alt="" onClick={e => e.stopPropagation()} />
          {featuredGallery.length > 1 && (
            <>
              <button className="lightbox-btn prev" onClick={e => { e.stopPropagation(); setLbIdx(i => (i - 1 + featuredGallery.length) % featuredGallery.length) }}><i className="bi bi-chevron-left"></i></button>
              <button className="lightbox-btn next" onClick={e => { e.stopPropagation(); setLbIdx(i => (i + 1) % featuredGallery.length) }}><i className="bi bi-chevron-right"></i></button>
            </>
          )}
          <button className="lightbox-close" onClick={() => setLbIdx(null)}><i className="bi bi-x-lg"></i></button>
          <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,0.6)', fontSize:'0.82rem' }}>
            {lbIdx + 1} / {featuredGallery.length}
          </div>
        </div>
      )}
    </div>
  )
}
