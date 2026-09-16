// ─────────────────────────────────────────────
//  AdminAnalytics.jsx
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Title, Filler,
} from 'chart.js'
import AdminLayout from '../../components/AdminLayout'
import Spinner     from '../../components/Spinner'
import StatCard    from '../../components/StatCard'
import { adminAPI } from '../../services/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Title, Filler)

const COLORS = ['#4f46e5','#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f43f5e','#0ea5e9']

const chartBase = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(129,140,248,0.08)' }, ticks: { color: '#818cf8', font: { family: 'Poppins' } } },
    x: { grid: { display: false }, ticks: { color: '#818cf8', font: { family: 'Poppins', size: 11 } } },
  },
}

export default function AdminAnalytics() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getAnalytics()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AdminLayout breadcrumb="Analytics"><Spinner message="Loading analytics..." /></AdminLayout>

  const { stats = {}, cand_data = [], hourly = [], daily = [] } = data || {}

  // Votes by candidate bar
  const candBar = {
    labels: cand_data.map(c => c.name),
    datasets: [{
      label: 'Votes', data: cand_data.map(c => c.vc),
      backgroundColor: COLORS, borderRadius: 8, borderSkipped: false,
    }],
  }

  // Vote share doughnut
  const doughnut = {
    labels: cand_data.map(c => c.name),
    datasets: [{
      data: cand_data.map(c => c.vc),
      backgroundColor: COLORS, borderWidth: 0, hoverOffset: 8,
    }],
  }

  // Hourly bar
  const hourlyBar = {
    labels: hourly.map(h => `${String(h.hr).padStart(2,'0')}:00`),
    datasets: [{
      label: 'Votes', data: hourly.map(h => h.cnt),
      backgroundColor: 'rgba(79,70,229,0.7)', borderRadius: 6,
    }],
  }

  // Daily line
  const dailyLine = {
    labels: daily.map(d => d.day),
    datasets: [{
      label: 'Votes', data: daily.map(d => d.cnt),
      borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.1)',
      tension: 0.4, fill: true, pointBackgroundColor: '#7c3aed',
    }],
  }

  // Voter participation doughnut
  const participationDoughnut = {
    labels: ['Voted', 'Not Voted', 'Blocked'],
    datasets: [{
      data: [stats.voted, stats.not_voted, stats.blocked],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0, hoverOffset: 8,
    }],
  }

  const doughnutOpts = {
    responsive: true, cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: 'Poppins', size: 11 }, color: '#818cf8', padding: 10 } },
    },
  }

  return (
    <AdminLayout breadcrumb="Analytics">
      {/* Stats */}
      <div className="row g-3" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: 'bi-people-fill',       color: 'blue',   value: stats.total_users,      label: 'Total Voters' },
          { icon: 'bi-check2-all',        color: 'green',  value: stats.voted,            label: 'Voted' },
          { icon: 'bi-hourglass-split',   color: 'orange', value: stats.not_voted,        label: 'Not Voted' },
          { icon: 'bi-slash-circle-fill', color: 'red',    value: stats.blocked,          label: 'Blocked' },
          { icon: 'bi-person-badge-fill', color: 'purple', value: stats.total_candidates, label: 'Candidates' },
          { icon: 'bi-graph-up-arrow',    color: 'green',  value: `${stats.turnout_pct}%`, label: 'Turnout' },
        ].map(s => (
          <div key={s.label} className="col-6 col-xl-2 col-lg-4">
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* Candidate votes + participation */}
      <div className="row g-4" style={{ marginBottom: '1.5rem' }}>
        <div className="col-lg-8">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="text-gradient" style={{ fontWeight: 800, marginBottom: '1rem' }}>Votes by Candidate</div>
            {cand_data.length > 0
              ? <Bar data={candBar} options={chartBase} />
              : <p style={{ opacity: 0.5, textAlign: 'center', padding: '3rem' }}>No votes yet.</p>}
          </div>
        </div>
        <div className="col-lg-4">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="text-gradient" style={{ fontWeight: 800, marginBottom: '1rem' }}>Voter Participation</div>
            <Doughnut data={participationDoughnut} options={doughnutOpts} />
          </div>
        </div>
      </div>

      {/* Vote share + hourly */}
      <div className="row g-4" style={{ marginBottom: '1.5rem' }}>
        <div className="col-lg-4">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="text-gradient" style={{ fontWeight: 800, marginBottom: '1rem' }}>Vote Share</div>
            {cand_data.length > 0
              ? <Doughnut data={doughnut} options={doughnutOpts} />
              : <p style={{ opacity: 0.5, textAlign: 'center', padding: '3rem' }}>No votes yet.</p>}
          </div>
        </div>
        <div className="col-lg-8">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="text-gradient" style={{ fontWeight: 800, marginBottom: '1rem' }}>Votes Today (by Hour)</div>
            {hourly.length > 0
              ? <Bar data={hourlyBar} options={chartBase} />
              : <p style={{ opacity: 0.5, textAlign: 'center', padding: '3rem' }}>No votes today.</p>}
          </div>
        </div>
      </div>

      {/* Daily trend */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="text-gradient" style={{ fontWeight: 800, marginBottom: '1rem' }}>Voting Trend (Last 14 Days)</div>
        {daily.length > 0
          ? <Line data={dailyLine} options={chartBase} />
          : <p style={{ opacity: 0.5, textAlign: 'center', padding: '3rem' }}>No data yet.</p>}
      </div>

      {/* Candidate breakdown table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div className="text-gradient" style={{ fontWeight: 800, marginBottom: '1.25rem' }}>Candidate Breakdown</div>
        {cand_data.length === 0
          ? <p style={{ opacity: 0.5 }}>No candidates yet.</p>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table-glass">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Party</th>
                    <th>Votes</th>
                    <th>Vote Share</th>
                  </tr>
                </thead>
                <tbody>
                  {cand_data.map((c, i) => (
                    <tr key={c.name}>
                      <td>
                        <span className="text-gradient" style={{ fontWeight: 800 }}>#{i + 1}</span>
                      </td>
                      <td>
                        <img src={`/uploads/${c.photo || 'default.png'}`} className="avatar" alt="" />
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ opacity: 0.7 }}>{c.party}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{c.vc}</td>
                      <td style={{ minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-glass" style={{ flexGrow: 1 }}>
                            <div className="progress-fill" style={{ width: `${c.pct}%` }} />
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: 36 }}>{c.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </AdminLayout>
  )
}
