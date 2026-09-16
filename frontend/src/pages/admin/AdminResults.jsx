// ─────────────────────────────────────────────
//  AdminResults.jsx  — Live results for admin
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title,
} from 'chart.js'
import AdminLayout from '../../components/AdminLayout'
import { adminAPI } from '../../services/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title)

const COLORS = ['#4f46e5','#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f43f5e','#0ea5e9']

const CHART_OPTS = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(129,140,248,0.08)' }, ticks: { color: '#818cf8', font: { family: 'Poppins' } } },
    x: { grid: { display: false }, ticks: { color: '#818cf8', font: { family: 'Poppins' } } },
  },
}

export default function AdminResults() {
  const [data,        setData]        = useState(null)
  const [lastUpdated, setLastUpdated] = useState('')
  const intervalRef = useRef()

  async function load() {
    try {
      const [dashRes, analyticsRes] = await Promise.all([adminAPI.dashboard(), adminAPI.getAnalytics()])
      const election = dashRes.data.election
      setData({
        candidates: analyticsRes.data.cand_data || [],
        total_votes: analyticsRes.data.stats?.total_votes || 0,
        election,
      })
      setLastUpdated(new Date().toLocaleTimeString())
    } catch { /* silent */ }
  }

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 10000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const candidates = data?.candidates || []
  const totalVotes = data?.total_votes || 0
  const election   = data?.election
  const winner     = candidates[0]
  const showWinner = election?.winner_declared && election?.election_status === 'ended'

  const labels = candidates.map(c => c.name)
  const counts = candidates.map(c => c.vc)

  return (
    <AdminLayout breadcrumb="Live Results">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div className="text-gradient" style={{ fontSize: '1.3rem', fontWeight: 800 }}>Live Results</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.55 }}>
            Auto-refreshes every 10 seconds · Last updated:{' '}
            <span style={{ fontWeight: 600, color: 'var(--success)' }}>{lastUpdated}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.88rem', opacity: 0.65 }}>
            <i className="bi bi-check2-all me-1" />Total votes: <strong>{totalVotes}</strong>
          </div>
          <span className="badge-success" style={{ padding: '8px 16px', borderRadius: 20, fontSize: '0.82rem',
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-circle-fill" style={{ fontSize: '0.5rem', animation: 'blink 1s infinite' }} /> Live
          </span>
        </div>
      </div>

      {/* Winner banner */}
      {showWinner && winner && (
        <div className="winner-card" style={{ marginBottom: '1.5rem' }}>
          <div className="winner-crown">🏆</div>
          <h2 className="text-gradient" style={{ fontWeight: 800, marginTop: '0.5rem' }}>{winner.name}</h2>
          <p style={{ opacity: 0.6 }}>{winner.party}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '0.75rem' }}>
            <div>
              <div className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>{winner.vc}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Total Votes</div>
            </div>
            <div>
              <div className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>{winner.pct}%</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Vote Share</div>
            </div>
          </div>
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
          <i className="bi bi-bar-chart" style={{ fontSize: '3rem' }} />
          <p style={{ marginTop: '1rem' }}>No results available yet.</p>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="row g-4" style={{ marginBottom: '1.5rem' }}>
            <div className="col-lg-8">
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="text-gradient" style={{ fontWeight: 800, marginBottom: '1rem' }}>Votes by Candidate</div>
                <Bar
                  data={{ labels, datasets: [{ label: 'Votes', data: counts,
                    backgroundColor: COLORS, borderRadius: 8, borderSkipped: false }] }}
                  options={CHART_OPTS}
                />
              </div>
            </div>
            <div className="col-lg-4">
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="text-gradient" style={{ fontWeight: 800, marginBottom: '1rem' }}>Vote Distribution</div>
                <Doughnut
                  data={{ labels, datasets: [{ data: counts, backgroundColor: COLORS, borderWidth: 0, hoverOffset: 8 }] }}
                  options={{
                    responsive: true, cutout: '65%',
                    plugins: {
                      legend: { position: 'bottom', labels: { font: { family: 'Poppins', size: 11 }, color: '#818cf8', padding: 10 } },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Rankings table */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="text-gradient" style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Rankings
            </div>
            {candidates.map((c, i) => (
              <div key={c.name || i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="text-gradient" style={{ width: 28, fontWeight: 800, fontSize: '1.1rem' }}>
                  #{i + 1}
                </div>
                <img src={`/uploads/${c.photo || 'default.png'}`} className="avatar-lg" alt="" />
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4,
                    flexWrap: 'wrap', gap: '0.25rem' }}>
                    <span style={{ fontWeight: 700 }}>
                      {c.name} <small style={{ opacity: 0.5, fontWeight: 400 }}>{c.party}</small>
                    </span>
                    <span style={{ fontWeight: 700 }}>{c.vc} votes ({c.pct}%)</span>
                  </div>
                  <div className="progress-glass" style={{ height: 12 }}>
                    <div className="progress-fill" style={{ width: `${c.pct}%`, height: 12 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed table */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="text-gradient" style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
              Detailed Results
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table-glass">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Party</th>
                    <th>Votes</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => (
                    <tr key={c.name || i}>
                      <td>
                        <span className="text-gradient" style={{ fontWeight: 800 }}>#{i + 1}</span>
                      </td>
                      <td>
                        <img src={`/uploads/${c.photo || 'default.png'}`} className="avatar" alt="" />
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ opacity: 0.7 }}>{c.party}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{c.vc}</td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-glass" style={{ flexGrow: 1 }}>
                            <div className="progress-fill" style={{ width: `${c.pct}%` }} />
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{c.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </AdminLayout>
  )
}
