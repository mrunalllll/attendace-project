// ─────────────────────────────────────────────
//  RegisterPage.jsx
//  Converted from: PHP routes/register.php + api/register.php
//
//  PHP → React mapping:
//  - <form enctype="multipart/form-data"> → FormData + axios multipart
//  - PHP password comparison              → controlled state compare
//  - PHP move_uploaded_file()             → multer on backend
//  - Image preview                        → FileReader + useState
//  - Password strength meter              → computed score from input value
// ─────────────────────────────────────────────
import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI }           from '../services/api'
import ThemeToggle           from '../components/ThemeToggle'
import Alert                 from '../components/Alert'

// ── Password strength helper ──────────────────
function getStrength(val) {
  let score = 0
  if (val.length >= 8)           score++
  if (/[A-Z]/.test(val))         score++
  if (/[0-9]/.test(val))         score++
  if (/[^A-Za-z0-9]/.test(val)) score++
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981']
  return { score, label: val.length ? labels[score] : '', color: colors[score] }
}

export default function RegisterPage() {
  // ── Form state (replaces PHP $_POST variables) ──
  const [form, setForm] = useState({
    name: '', mob: '', email: '', pass: '', cpass: '', address: '',
  })
  const [photo,    setPhoto]    = useState(null)       // File object
  const [preview,  setPreview]  = useState('/uploads/default.png')
  const [showPass, setShowPass] = useState(false)
  const [showCPass,setShowCPass]= useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const fileRef  = useRef()
  const navigate = useNavigate()

  const strength = getStrength(form.pass)

  // Generic field change
  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  // Image preview (replaces PHP side — no PHP involved here)
  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  // ── Submit (replaces PHP api/register.php) ────
  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')

    // Client-side validation (mirrors PHP validation)
    if (form.name.trim().length < 2)         return setError('Name must be at least 2 characters.')
    if (!/^\d{10}$/.test(form.mob))          return setError('Enter a valid 10-digit mobile number.')
    if (form.pass.length < 8)                return setError('Password must be at least 8 characters.')
    if (form.pass !== form.cpass)            return setError('Passwords do not match.')
    if (form.address.trim().length < 3)      return setError('Please enter a valid address.')

    // Build FormData (replaces PHP multipart form)
    const fd = new FormData()
    fd.append('name',    form.name.trim())
    fd.append('mob',     form.mob)
    fd.append('email',   form.email)
    fd.append('pass',    form.pass)
    fd.append('cpass',   form.cpass)
    fd.append('address', form.address.trim())
    if (photo) fd.append('image', photo)

    setLoading(true)
    try {
      const res = await authAPI.register(fd)
      if (res.data.success) {
        setSuccess('Registration successful! Redirecting to login...')
        setTimeout(() => navigate('/'), 2000)
      } else {
        setError(res.data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── JSX ──────────────────────────────────────
  return (
    <>
      <div className="animated-bg" />
      <div className="blob blob-1" /><div className="blob blob-2" />

      <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      <div className="login-wrapper" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="login-card" style={{ maxWidth: 580 }}>

          {/* Header */}
          <div className="login-logo"><i className="bi bi-person-plus-fill" /></div>
          <h1 className="text-gradient" style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.5rem' }}>
            Create Account
          </h1>
          <p style={{ textAlign: 'center', fontSize: '0.82rem', opacity: 0.55, marginBottom: '1.5rem' }}>
            Register to participate in the national election
          </p>

          {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit} encType="multipart/form-data" noValidate>

            {/* Photo preview — replaces PHP's file input */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                className="img-preview-wrap"
                onClick={() => fileRef.current.click()}
                title="Click to upload photo"
              >
                <img src={preview} alt="preview" />
                <div className="img-overlay"><i className="bi bi-camera-fill" /></div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhoto}
              />
              <div style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: 4 }}>
                Click to upload photo (max 5 MB)
              </div>
            </div>

            <div className="row g-3">

              {/* Full name */}
              <div className="col-12">
                <label className="form-label">Full Name *</label>
                <div className="input-icon-wrapper">
                  <i className="bi bi-person-fill input-icon" />
                  <input name="name" type="text" className="form-control-glass"
                    placeholder="Enter your full name" value={form.name} onChange={handleChange} required />
                </div>
              </div>

              {/* Mobile */}
              <div className="col-sm-6">
                <label className="form-label">Mobile Number *</label>
                <div className="input-icon-wrapper">
                  <i className="bi bi-phone-fill input-icon" />
                  <input name="mob" type="tel" className="form-control-glass"
                    placeholder="10-digit mobile" maxLength={10} value={form.mob}
                    onChange={e => setForm(f => ({ ...f, mob: e.target.value.replace(/\D/,'') }))} required />
                </div>
              </div>

              {/* Email */}
              <div className="col-sm-6">
                <label className="form-label">Email Address</label>
                <div className="input-icon-wrapper">
                  <i className="bi bi-envelope-fill input-icon" />
                  <input name="email" type="email" className="form-control-glass"
                    placeholder="your@email.com" value={form.email} onChange={handleChange} />
                </div>
              </div>

              {/* Address */}
              <div className="col-12">
                <label className="form-label">Address *</label>
                <div className="input-icon-wrapper">
                  <i className="bi bi-geo-alt-fill input-icon" />
                  <input name="address" type="text" className="form-control-glass"
                    placeholder="Enter your full address" value={form.address} onChange={handleChange} required />
                </div>
              </div>

              {/* Password */}
              <div className="col-sm-6">
                <label className="form-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <div className="input-icon-wrapper">
                    <i className="bi bi-lock-fill input-icon" />
                    <input name="pass" type={showPass ? 'text' : 'password'}
                      className="form-control-glass" placeholder="Min 8 characters"
                      value={form.pass} onChange={handleChange}
                      style={{ paddingRight: '3rem' }} required />
                  </div>
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ position:'absolute',right:'0.75rem',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',opacity:0.5 }}>
                    <i className={`bi ${showPass ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} />
                  </button>
                </div>
                {/* Strength bar */}
                <div className={`strength-bar strength-${strength.score}`} />
                <div style={{ fontSize: '0.72rem', marginTop: 3, fontWeight: 600, color: strength.color }}>
                  {strength.label}
                </div>
              </div>

              {/* Confirm password */}
              <div className="col-sm-6">
                <label className="form-label">Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <div className="input-icon-wrapper">
                    <i className="bi bi-shield-lock-fill input-icon" />
                    <input name="cpass" type={showCPass ? 'text' : 'password'}
                      className="form-control-glass" placeholder="Repeat password"
                      value={form.cpass} onChange={handleChange}
                      style={{ paddingRight: '3rem' }} required />
                  </div>
                  <button type="button" onClick={() => setShowCPass(s => !s)}
                    style={{ position:'absolute',right:'0.75rem',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',opacity:0.5 }}>
                    <i className={`bi ${showCPass ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} />
                  </button>
                </div>
                {form.cpass && (
                  <div style={{ fontSize: '0.72rem', marginTop: 3, fontWeight: 600,
                    color: form.pass === form.cpass ? 'var(--success)' : 'var(--danger)' }}>
                    {form.pass === form.cpass ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </div>

              {/* Password requirements */}
              <div className="col-12">
                <div className="glass-card" style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', borderRadius: 10 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.4rem', opacity: 0.7 }}>
                    <i className="bi bi-shield-check me-1" /> Password requirements:
                  </div>
                  <div className="row g-1">
                    {[
                      ['At least 8 characters', form.pass.length >= 8],
                      ['One uppercase letter',  /[A-Z]/.test(form.pass)],
                      ['One number',            /[0-9]/.test(form.pass)],
                      ['One special character', /[^A-Za-z0-9]/.test(form.pass)],
                    ].map(([text, met]) => (
                      <div key={text} className="col-6"
                        style={{ color: met ? 'var(--success)' : 'inherit', opacity: met ? 1 : 0.5 }}>
                        <i className={`bi ${met ? 'bi-check-circle-fill' : 'bi-circle'} me-1`} />
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="col-12">
                <button
                  type="submit"
                  className="btn-gradient"
                  style={{ width: '100%', padding: '0.85rem', justifyContent: 'center', fontSize: '0.95rem' }}
                  disabled={loading}
                >
                  {loading
                    ? <><i className="bi bi-hourglass-split" /> Creating account...</>
                    : <><i className="bi bi-person-check-fill" /> Create Account</>
                  }
                </button>
              </div>
            </div>
          </form>

          <hr style={{ border:'none', borderTop:'1px solid var(--border)', margin:'1.25rem 0' }} />
          <p style={{ textAlign:'center', fontSize:'0.83rem', opacity:0.65 }}>
            Already registered?{' '}
            <Link to="/" className="text-gradient" style={{ textDecoration:'none', fontWeight:600 }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
