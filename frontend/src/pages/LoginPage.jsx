// ─────────────────────────────────────────────
//  LoginPage.jsx
//  Converted from: PHP index.php
//
//  PHP → React mapping:
//  - $_POST['mob','pass','role'] → useState controlled inputs
//  - PHP session redirect        → useNavigate after API call
//  - PHP echo alert()            → Alert component with state
//  - role select (1/2)           → toggle button state
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate, Link }   from 'react-router-dom'
import { useAuth }             from '../context/AuthContext'
import ThemeToggle             from '../components/ThemeToggle'
import Alert                   from '../components/Alert'

export default function LoginPage() {
  // ── State (replaces PHP $_POST variables) ──
  const [mob,      setMob]      = useState('')
  const [pass,     setPass]     = useState('')
  const [role,     setRole]     = useState(1)       // 1=voter, 2=admin
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const { login, user } = useAuth()
  const navigate        = useNavigate()

  // If already logged in → redirect
  useEffect(() => {
    if (user) navigate(user.role === 2 ? '/admin/dashboard' : '/voter/dashboard', { replace: true })
  }, [user])

  // Restore remembered mobile
  useEffect(() => {
    const saved = document.cookie.split(';').find(c => c.trim().startsWith('vs_mobile='))
    if (saved) { setMob(saved.split('=')[1]); setRemember(true) }
  }, [])

  // ── Form submit (replaces PHP api/login.php) ──
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Client-side validation (mirrors PHP validation)
    if (!/^\d{10}$/.test(mob)) return setError('Please enter a valid 10-digit mobile number.')
    if (!pass)                  return setError('Password is required.')

    setLoading(true)
    try {
      const res = await login(mob, pass, role)
      if (!res.success) { setError(res.message); return }
      // Remember me cookie
      if (remember) document.cookie = `vs_mobile=${mob}; max-age=${30*24*3600}; path=/`
      else          document.cookie = `vs_mobile=; max-age=0; path=/`
      navigate(role === 2 ? '/admin/dashboard' : '/voter/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── JSX ──────────────────────────────────────
  return (
    <>
      {/* Animated background (same as PHP version) */}
      <div className="animated-bg" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Theme toggle top-right */}
      <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      <div className="login-wrapper">
        <div className="login-card">

          {/* Logo */}
          <div className="login-logo"><i className="bi bi-shield-check" /></div>
          <h1 className="text-gradient" style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.6rem' }}>
            VoteSecure
          </h1>
          <p style={{ textAlign: 'center', fontSize: '0.82rem', opacity: 0.55, marginBottom: '1.75rem' }}>
            National Online Voting System — Secure &amp; Transparent
          </p>

          {/* Error alert */}
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleSubmit} noValidate>

            {/* Role toggle (replaces PHP <select name="role">) */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                className={role === 1 ? 'btn-gradient' : 'btn-glass'}
                style={{ flex: 1 }}
                onClick={() => setRole(1)}
              >
                <i className="bi bi-person-fill" /> Voter
              </button>
              <button
                type="button"
                className={role === 2 ? 'btn-gradient' : 'btn-glass'}
                style={{ flex: 1 }}
                onClick={() => setRole(2)}
              >
                <i className="bi bi-shield-fill" /> Admin
              </button>
            </div>

            {/* Mobile number */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Mobile Number</label>
              <div className="input-icon-wrapper">
                <i className="bi bi-phone-fill input-icon" />
                <input
                  type="tel"
                  className="form-control-glass"
                  placeholder="Enter 10-digit mobile"
                  maxLength={10}
                  value={mob}
                  onChange={e => setMob(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            {/* Password with show/hide toggle */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <a href="#" className="text-gradient" style={{ fontSize: '0.78rem', textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <div className="input-icon-wrapper">
                  <i className="bi bi-lock-fill input-icon" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control-glass"
                    placeholder="Enter password"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    style={{ paddingRight: '3rem' }}
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5,
                  }}
                >
                  <i className={`bi ${showPass ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} />
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.83rem' }}>
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <label htmlFor="remember" style={{ cursor: 'pointer' }}>Remember me</label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="btn-gradient"
              style={{ width: '100%', padding: '0.85rem', justifyContent: 'center', fontSize: '0.95rem' }}
              disabled={loading}
            >
              {loading
                ? <><i className="bi bi-hourglass-split" /> Signing in...</>
                : <><i className="bi bi-box-arrow-in-right" /> Sign In Securely</>
              }
            </button>
          </form>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} />

          <p style={{ textAlign: 'center', fontSize: '0.83rem', opacity: 0.65 }}>
            New voter?{' '}
            <Link to="/register" className="text-gradient" style={{ textDecoration: 'none', fontWeight: 600 }}>
              Register here
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div className="glass-card" style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', opacity: 0.7, borderRadius: 10, marginTop: '1rem' }}>
            <i className="bi bi-info-circle me-1" />
            <strong>Demo Admin:</strong> Mobile <code>9999999999</code> · Password <code>Admin@123</code>
          </div>
        </div>
      </div>
    </>
  )
}
