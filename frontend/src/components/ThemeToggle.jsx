// ─────────────────────────────────────────────
//  ThemeToggle — dark / light mode button
//  Drop it anywhere: <ThemeToggle />
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('vs_theme') === 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('vs_theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div
      className="theme-toggle"
      onClick={() => setDark(d => !d)}
      title="Toggle dark / light mode"
      style={{ cursor: 'pointer' }}
    >
      <div className="toggle-thumb">
        <i className={`bi ${dark ? 'bi-sun-fill' : 'bi-moon-fill'}`} />
      </div>
    </div>
  )
}
