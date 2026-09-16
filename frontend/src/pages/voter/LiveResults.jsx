// ─────────────────────────────────────────────
//  LiveResults.jsx  (Voter)
//  Converted from: PHP voter/live_results.php
//
//  PHP → React mapping:
//  - PHP setInterval JS        → useEffect + setInterval
//  - PHP echo Chart.js inline  → react-chartjs-2 components
//  - PHP fetch /api/get_results → resultsAPI.get()
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { Link }      from 'react-router-dom'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title,
} from 'chart.js'
import { resultsAPI } from '../../services/api'
import VoterNavbar    from '../../components/VoterNavbar'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title)

const COLORS = ['#4f46e5','#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6']
const CHART_OPTS = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title:  { display: true, font: { family: 'Poppins', size: 14 }, color: '#818cf8' },
  },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(129,140,248,0.08)' }, ticks: { color: '#818cf8', font: { family: 'Poppins' } } },
    x: { grid: { display: false },                                      ticks: { color: '#818cf8', font: { family: 'Poppins' } } },
  },
}

export default function LiveResults() {
  const [data,        setData]        = useState(null)
  const [lastUpdated, setLastUpdated] = useState('')
  const intervalRef = useRef()

  // Fetch + auto-refresh every 5 s (replaces PHP setInterval)
  async function load() {
    try {
      const res = await resultsAPI.get()
      setData(res.data)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch { /* silent */ }
  }

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 5000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const candidates  = data?.candidates || []
  const totalVotes  = data?.total_votes || 0
  const election    = data?.election
  const winner      = candidates[0]
  const showWinner  = election?.winner_declared && election?.election_status === 'ended'

  const labels     = candidates.map(c => c.name)
  const counts     = candidates.map(c => c.vote_count)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="blob blob-1" style={{ opacity: 0.04 }} />
      <VoterNavbar />

      <div className="container-fluid" style={{ padding: '1.5rem' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
          <div>
            <div className="text-gradient" style={{ fontSize:'1.5rem', fontWeight:800 }}>
              Live Election Results
            </div>
            <div style={{ fontSize:'0.8rem', opacity:0.55 }}>
              Auto-refreshes every 5 seconds · Last updated:{' '}
              <span style={{ fontWeight:600, color:'var(--success)' }}>{lastUpdated}</span>
            </div>
          </div>
          <span className="badge-success" style={{ padding:'8px 16px', borderRadius:20, fontSize:'0.82rem',
            display:'flex', alignItems:'center', gap:6 }}>
            <i className="bi bi-circle-fill" style={{ fontSize:'0.5rem',
              animation:'blink 1s infinite' }} /> Live
          </span>
        </div>

        {/* Winner card */}
        {showWinner && winner && (
          <div className="winner-card" style={{ marginBottom: '1.5rem' }}>
            <div className="winner-crown">🏆</div>
            <h2 className="text-gradient" style={{ fontWeight:800, marginTop:'0.5rem' }}>
              {winner.name}
            </h2>
            <p style={{ opacity:0.6 }}>{winner.party}</p>
            <div style={{ display:'flex', justifyContent:'center', gap:'2rem', marginTop:'0.75rem' }}>
              <div>
                <div className="text-gradient" style={{ fontSize:'2rem', fontWeight:800 }}>{winner.vote_count}</div>
                <div style={{ fontSize:'0.8rem', opacity:0.6 }}>Total Votes</div>
              </div>
              <div>
                <div className="text-gradient" style={{ fontSize:'2rem', fontWeight:800 }}>{winner.pct}%</div>
                <div style={{ fontSize:'0.8rem', opacity:0.6 }}>Vote Share</div>
              </div>
            </div>
          </div>
        )}

        {candidates.length === 0 ? (
          <div className="glass-card" style={{ padding:'4rem', textAlign:'center', opacity:0.5 }}>
            <i className="bi bi-bar-chart" style={{ fontSize:'3rem' }} />
            <p style={{ marginTop:'1rem' }}>No results available yet.</p>
          </div>
        ) : (
          <>
            {/* Charts row */}
            <div className="row g-4" style={{ marginBottom:'1.5rem' }}>
              <div className="col-lg-8">
                <div className="glass-card" style={{ padding:'1.5rem' }}>
                  <Bar
                    data={{ labels, datasets: [{ label:'Votes', data: counts,
                      backgroundColor: COLORS, borderRadius: 8, borderSkipped: false }] }}
                    options={{ ...CHART_OPTS,
                      plugins: { ...CHART_OPTS.plugins, title: { ...CHART_OPTS.plugins.title, text:'Candidate Votes' } } }}
                  />
                </div>
              </div>
              <div className="col-lg-4">
                <div className="glass-card" style={{ padding:'1.5rem' }}>
                  <Doughnut
                    data={{ labels, datasets: [{ data: counts, backgroundColor: COLORS, borderWidth: 0, hoverOffset: 8 }] }}
                    options={{
                      responsive: true, cutout: '65%',
                      plugins: {
                        legend: { position:'bottom', labels: { font:{ family:'Poppins', size:11 }, color:'#818cf8', padding:10 } },
                        title:  { display:true, text:'Vote Distribution', font:{ family:'Poppins', size:14 }, color:'#818cf8' },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Rankings list */}
            <div className="glass-card" style={{ padding:'1.5rem' }}>
              <div className="text-gradient" style={{ fontWeight:800, fontSize:'1.1rem', marginBottom:'1.5rem' }}>
                Rankings
              </div>
              {candidates.map((c, i) => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' }}>
                  <div className="text-gradient" style={{ width:28, fontWeight:800, fontSize:'1.1rem' }}>
                    #{i+1}
                  </div>
                  <img src={`/uploads/${c.photo || 'default.png'}`} className="avatar-lg" alt="" />
                  <div style={{ flexGrow:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4,
                      flexWrap:'wrap', gap:'0.25rem' }}>
                      <span style={{ fontWeight:700 }}>
                        {c.name} <small style={{ opacity:0.5, fontWeight:400 }}>{c.party}</small>
                      </span>
                      <span style={{ fontWeight:700 }}>{c.vote_count} votes ({c.pct}%)</span>
                    </div>
                    <div className="progress-glass" style={{ height:12 }}>
                      <div className="progress-fill" style={{ width:`${c.pct}%`, height:12 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}
