// ─────────────────────────────────────────────
//  AdminDashboard.jsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Tooltip, Legend, Title, Filler,
} from 'chart.js'
import AdminLayout from '../../components/AdminLayout'
import Spinner     from '../../components/Spinner'
import StatCard    from '../../components/StatCard'
import { adminAPI } from '../../services/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Title, Filler)

const COLORS = ['#4f46e5','#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6']

export default function AdminDashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.dashboard()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AdminLayout breadcrumb="Dashboard"><Spinner message="Loading dashboard..." /></AdminLayout>

  const { stats = {}, election, cand_chart = [], daily = [], recent_logs = [], top_cand } = data || {}

  const barData = {
    labels:   cand_chart.map(c => c.name),
    datasets: [{ label: 'Votes', data: cand_chart.map(c => c.vc),
      backgroundColor: COLORS, borderRadius: 8, borderSkipped: false }],
  }

  const lineData = {
    labels: daily.map(d => d.day),
    datasets: [{
      label: 'Votes', data: daily.map(d => d.cnt),
      borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.1)',
      tension: 0.4, fill: true, pointBackgroundColor: '#4f46e5',
    }],
  }

  const chartOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(129,140,248,0.08)' }, ticks: { color: '#818cf8', font: { family: 'Poppins' } } },
      x: { grid: { display: false }, ticks: { color: '#818cf8', font: { family: 'Poppins' } } },
    },
  }

  const elecStatus = election?.election_status || 'pending'

  return (
    <AdminLayout breadcrumb="Dashboard">
      {/* Election status banner */}
      {election && (
        <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className={`stat-icon ${elecStatus === 'active' ? 'green' : elecStatus === 'ended' ? 'red' : 'orange'}`}>
              <i className="bi bi-flag-fill" />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{election.election_name}</div>
              <div style={{ fontSize: '0.78rem', opacity: 0.55 }}>
                {elecStatus === 'active'
                  ? <span className="badge-success">🟢 Election is LIVE</span>
                  : elecStatus === 'ended'
                    ? <span className="badge-danger">🔴 Election Ended</span>
                    : <span className="badge-warning">🟡 Election Pending</span>}
              </div>
            </div>
          </div>
          <Link to="/admin/election" className="btn-gradient" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>
            <i className="bi bi-gear-fill" /> Manage Election
          </Link>
        </div>
      )}

      {/* Stats row — voting */}
      <div className="row g-3" style={{ marginBottom: '1rem' }}>
        {[
          { icon: 'bi-people-fill',       color: 'blue',   value: stats.total_users,      label: 'Total Voters' },
          { icon: 'bi-person-badge-fill', color: 'purple', value: stats.total_candidates, label: 'Candidates' },
          { icon: 'bi-check2-all',        color: 'green',  value: stats.total_votes,      label: 'Total Votes' },
          { icon: 'bi-graph-up-arrow',    color: 'orange', value: `${stats.turnout_pct}%`, label: 'Voter Turnout' },
          { icon: 'bi-person-check-fill', color: 'green',  value: stats.voted_users,      label: 'Voted' },
          { icon: 'bi-person-x-fill',     color: 'red',    value: stats.blocked_users,    label: 'Blocked' },
        ].map(s => (
          <div key={s.label} className="col-6 col-xl-2 col-lg-4">
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* Stats row — college */}
      <div className="row g-3" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: 'bi-building-fill',        color: 'cyan',   value: stats.total_departments,   label: 'Departments' },
          { icon: 'bi-calendar-event-fill',  color: 'purple', value: stats.total_events,        label: 'Total Events' },
          { icon: 'bi-calendar-check-fill',  color: 'green',  value: stats.upcoming_events,     label: 'Upcoming Events' },
          { icon: 'bi-images',               color: 'orange', value: stats.total_gallery,       label: 'Gallery Photos' },
          { icon: 'bi-megaphone-fill',       color: 'blue',   value: stats.total_announcements, label: 'Announcements' },
          { icon: 'bi-mortarboard-fill',     color: 'pink',   value: stats.total_users,         label: 'Students' },
        ].map(s => (
          <div key={s.label} className="col-6 col-xl-2 col-lg-4">
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* Quick links — college management */}
      <div className="row g-3" style={{ marginBottom: '1.5rem' }}>
        {[
          { to: '/admin/departments',   icon: 'bi-building-fill',       label: 'Departments',   color: 'cyan' },
          { to: '/admin/events',        icon: 'bi-calendar-event-fill', label: 'Events',        color: 'purple' },
          { to: '/admin/gallery',       icon: 'bi-images',              label: 'Gallery',       color: 'orange' },
          { to: '/admin/announcements', icon: 'bi-megaphone-fill',      label: 'Announcements', color: 'blue' },
        ].map(item => (
          <div key={item.to} className="col-6 col-md-3">
            <Link to={item.to} className="glass-card d-flex align-items-center gap-3 p-3 text-decoration-none hover-lift" style={{ color: 'var(--text)' }}>
              <div className={`stat-icon ${item.color}`}><i className={`bi ${item.icon}`}></i></div>
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{item.label}</span>
              <i className="bi bi-arrow-right ms-auto" style={{ opacity: 0.4 }}></i>
            </Link>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-4" style={{ marginBottom: '1.5rem' }}>
        <div className="col-lg-7">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="text-gradient" style={{ fontWeight: 800, marginBottom: '1rem' }}>
              Votes by Candidate
            </div>
            {cand_chart.length > 0
              ? <Bar data={barData} options={chartOpts} />
              : <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No data yet.</p>}
          </div>
        </div>
        <div className="col-lg-5">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="text-gradient" style={{ fontWeight: 800, marginBottom: '1rem' }}>
              Voting Activity (Last 7 Days)
            </div>
            {daily.length > 0
              ? <Line data={lineData} options={chartOpts} />
              : <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No data yet.</p>}
          </div>
        </div>
      </div>

      {/* Top candidate + Recent logs */}
      <div className="row g-4">
        {top_cand && (
          <div className="col-lg-4">
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div className="text-gradient" style={{ fontWeight: 800, marginBottom: '1rem' }}>
                🏆 Leading Candidate
              </div>
              <img src={`/uploads/${top_cand.photo || 'default.png'}`} className="avatar-xl" alt="" />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '1rem' }}>{top_cand.name}</div>
              <div style={{ opacity: 0.55, fontSize: '0.82rem' }}>{top_cand.party}</div>
              <div className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.75rem' }}>
                {top_cand.vc}
              </div>
              <div style={{ opacity: 0.5, fontSize: '0.75rem' }}>votes</div>
            </div>
          </div>
        )}

        <div className={top_cand ? 'col-lg-8' : 'col-12'}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="text-gradient" style={{ fontWeight: 800 }}>Recent Activity</div>
              <Link to="/admin/logs" className="btn-glass" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
                View All
              </Link>
            </div>
            {recent_logs.length === 0
              ? <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No activity yet.</p>
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table-glass" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Action</th>
                        <th>Description</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent_logs.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 600 }}>{log.uname || 'System'}</td>
                          <td><span className="badge-info">{log.action}</span></td>
                          <td style={{ opacity: 0.7 }}>{log.description || '—'}</td>
                          <td style={{ opacity: 0.55, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
