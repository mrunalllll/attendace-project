// ─────────────────────────────────────────────
//  Spinner — full-page loading indicator
//  Usage: <Spinner />  or  <Spinner message="Loading..." />
// ─────────────────────────────────────────────
export default function Spinner({ message = 'Loading...' }) {
  return (
    <div className="login-wrapper">
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 56, height: 56, margin: '0 auto 1rem',
            border: '4px solid rgba(79,70,229,0.2)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div className="text-gradient fw-bold">{message}</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
