// ─────────────────────────────────────────────
//  Alert component
//  Usage: <Alert type="success" message="Done!" onClose={() => setMsg('')} />
//  type: 'success' | 'error' | 'warning' | 'info'
// ─────────────────────────────────────────────
export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null

  const icons = {
    success: 'bi-check-circle-fill',
    error:   'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info:    'bi-info-circle-fill',
  }

  return (
    <div className={`alert-glass ${type} fade-in`} style={{ justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <i className={`bi ${icons[type] || icons.info}`}></i>
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '1rem' }}>
          <i className="bi bi-x-lg"></i>
        </button>
      )}
    </div>
  )
}
