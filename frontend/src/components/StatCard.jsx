// ─────────────────────────────────────────────
//  StatCard — dashboard statistics card
//  Usage:
//    <StatCard icon="bi-people-fill" color="blue" value={120} label="Voters" />
//  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan' | 'pink'
// ─────────────────────────────────────────────
export default function StatCard({ icon, color = 'blue', value, label }) {
  return (
    <div className="stat-card d-flex align-items-center gap-3">
      <div className={`stat-icon ${color}`}>
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <div className="stat-value text-gradient">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
