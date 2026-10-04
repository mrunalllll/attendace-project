// ─────────────────────────────────────────────
//  SandipLogo — Sandip University logo component
//
//  Usage:
//    <SandipLogo size={48} />           → lion icon only
//    <SandipLogo size={48} full />       → icon + "Sandip University" text
//    <SandipLogo size={48} white />      → white version (for dark backgrounds)
//    <SandipLogo size={48} full white /> → full white version
//
//  To use the real PNG logo instead of SVG:
//    1. Copy your logo PNG to frontend/public/sandip-logo.png
//    2. Change USE_PNG to true below
// ─────────────────────────────────────────────

const USE_PNG = false   // ← set true if you have real PNG in /public/sandip-logo.png

export default function SandipLogo({ size = 40, full = false, white = false, className = '' }) {
  const color = white ? '#ffffff' : '#1e293b'
  const accent = white ? 'rgba(255,255,255,0.85)' : '#4f46e5'
  const gold = white ? 'rgba(255,255,255,0.7)' : '#c8a96e'

  if (USE_PNG) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }} className={className}>
        <img src="/sandip-logo.png" alt="Sandip University" style={{ width: size, height: size, objectFit: 'contain' }} />
        {full && (
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: size * 0.38, fontWeight: 800, color, letterSpacing: '-0.02em', fontFamily: 'Poppins, sans-serif' }}>SANDIP</div>
            <div style={{ fontSize: size * 0.22, fontWeight: 500, color: gold, letterSpacing: '0.18em', fontFamily: 'Poppins, sans-serif' }}>UNIVERSITY</div>
          </div>
        )}
      </div>
    )
  }

  // ── SVG Lion + Rays (Sandip University mark) ──
  // Faithful recreation of the circular lion-in-sunburst emblem
  const r = size / 2

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: full ? 10 : 0 }} className={className}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}>
        {/* Outer circle */}
        <circle cx="50" cy="50" r="48" stroke={white ? 'rgba(255,255,255,0.6)' : '#1e293b'} strokeWidth="2.5" fill={white ? 'rgba(255,255,255,0.08)' : 'rgba(79,70,229,0.06)'} />

        {/* Sunburst rays */}
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i * 360) / 24
          const rad = (angle * Math.PI) / 180
          const innerR = 28, outerR = 46
          const x1 = 50 + innerR * Math.cos(rad)
          const y1 = 50 + innerR * Math.sin(rad)
          const x2 = 50 + outerR * Math.cos(rad)
          const y2 = 50 + outerR * Math.sin(rad)
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={white ? 'rgba(255,255,255,0.5)' : '#1e293b'} strokeWidth="1.8" strokeLinecap="round" />
          )
        })}

        {/* Inner circle (white fill to cover ray centres) */}
        <circle cx="50" cy="50" r="26" fill={white ? 'rgba(255,255,255,0.15)' : 'white'} stroke={white ? 'rgba(255,255,255,0.4)' : '#1e293b'} strokeWidth="1.5" />

        {/* Lion face — stylised */}
        {/* Mane outer */}
        <circle cx="50" cy="50" r="18" fill={white ? 'rgba(255,255,255,0.18)' : '#f0ece4'} />
        {/* Mane spikes */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 360 / 12 - 90) * Math.PI / 180
          const mx = 50 + 18 * Math.cos(a), my = 50 + 18 * Math.sin(a)
          const ax = 50 + 23 * Math.cos(a - 0.26), ay = 50 + 23 * Math.sin(a - 0.26)
          const bx = 50 + 23 * Math.cos(a + 0.26), by = 50 + 23 * Math.sin(a + 0.26)
          return <polygon key={i} points={`${mx},${my} ${ax},${ay} ${bx},${by}`}
            fill={white ? 'rgba(255,255,255,0.35)' : '#2d2416'} />
        })}

        {/* Face */}
        <circle cx="50" cy="51" r="13" fill={white ? 'rgba(255,255,255,0.22)' : '#e8d8b0'} />

        {/* Eyes */}
        <circle cx="45.5" cy="48" r="2.2" fill={white ? 'rgba(255,255,255,0.9)' : '#1a1007'} />
        <circle cx="54.5" cy="48" r="2.2" fill={white ? 'rgba(255,255,255,0.9)' : '#1a1007'} />
        {/* Eye shine */}
        <circle cx="46.5" cy="47.2" r="0.7" fill="white" />
        <circle cx="55.5" cy="47.2" r="0.7" fill="white" />

        {/* Nose */}
        <ellipse cx="50" cy="52.5" rx="2" ry="1.3" fill={white ? 'rgba(255,255,255,0.7)' : '#8b3a1a'} />

        {/* Mouth */}
        <path d="M47.5 54 Q50 56.5 52.5 54" stroke={white ? 'rgba(255,255,255,0.7)' : '#8b3a1a'} strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M48.5 54.5 Q50 53.2 51.5 54.5" stroke={white ? 'rgba(255,255,255,0.5)' : '#8b3a1a'} strokeWidth="0.8" fill="none" />

        {/* Brow */}
        <path d="M43.5 46 Q45.5 44.5 47.5 45.5" stroke={white ? 'rgba(255,255,255,0.6)' : '#2d2416'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M56.5 46 Q54.5 44.5 52.5 45.5" stroke={white ? 'rgba(255,255,255,0.6)' : '#2d2416'} strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Ears */}
        <polygon points="42,39 38,33 46,37" fill={white ? 'rgba(255,255,255,0.35)' : '#2d2416'} />
        <polygon points="58,39 62,33 54,37" fill={white ? 'rgba(255,255,255,0.35)' : '#2d2416'} />
        <polygon points="42,39 39,35 45,38" fill={white ? 'rgba(255,255,255,0.18)' : '#e8c88a'} />
        <polygon points="58,39 61,35 55,38" fill={white ? 'rgba(255,255,255,0.18)' : '#e8c88a'} />

        {/* Whiskers */}
        <line x1="36" y1="51" x2="46" y2="52" stroke={white ? 'rgba(255,255,255,0.5)' : '#2d2416'} strokeWidth="0.8" />
        <line x1="36" y1="53" x2="46" y2="53.5" stroke={white ? 'rgba(255,255,255,0.5)' : '#2d2416'} strokeWidth="0.8" />
        <line x1="64" y1="51" x2="54" y2="52" stroke={white ? 'rgba(255,255,255,0.5)' : '#2d2416'} strokeWidth="0.8" />
        <line x1="64" y1="53" x2="54" y2="53.5" stroke={white ? 'rgba(255,255,255,0.5)' : '#2d2416'} strokeWidth="0.8" />
      </svg>

      {full && (
        <div style={{ lineHeight: 1.1, userSelect: 'none' }}>
          <div style={{ fontSize: size * 0.38, fontWeight: 800, color, letterSpacing: '-0.01em', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap' }}>
            SANDIP
          </div>
          <div style={{ fontSize: size * 0.2, fontWeight: 500, color: gold, letterSpacing: '0.2em', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap', marginTop: -2 }}>
            UNIVERSITY
          </div>
        </div>
      )}
    </div>
  )
}
