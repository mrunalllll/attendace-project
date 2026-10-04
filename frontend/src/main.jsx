import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ── Error boundary to catch render crashes and show a readable error ──
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0f172a', color: '#f1f5f9', fontFamily: 'monospace', padding: '2rem',
        }}>
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠ App Error</h2>
            <pre style={{
              background: '#1e293b', padding: '1rem', borderRadius: 8,
              fontSize: '0.8rem', overflow: 'auto', whiteSpace: 'pre-wrap',
            }}>
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem', padding: '0.5rem 1.5rem',
                background: '#4f46e5', color: 'white', border: 'none',
                borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
