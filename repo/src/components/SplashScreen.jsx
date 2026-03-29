import { useState, useEffect } from 'react'
import { APP_NAME, APP_VERSION, PROJECT_LABEL } from '../constants'

const STAGES = [
  { pct: 15, text: 'Initializing Academic Pulse Pro...' },
  { pct: 35, text: 'Loading Scholar Engine module...' },
  { pct: 55, text: 'Establishing Supabase connection...' },
  { pct: 72, text: 'Authenticating publication schema...' },
  { pct: 88, text: 'Loading export pipeline...' },
  { pct: 100, text: 'All systems operational.' },
]

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState(STAGES[0].text)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    let i = 0
    const iv = setInterval(() => {
      if (i < STAGES.length) {
        setProgress(STAGES[i].pct)
        setStatusText(STAGES[i].text)
        i++
      } else {
        clearInterval(iv)
        setFadeOut(true)
        setTimeout(onComplete, 550)
      }
    }, 460)
    return () => clearInterval(iv)
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#02040a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.55s ease',
    }}>
      {/* Sparkle */}
      <div className="sparkle-animate" style={{
        fontSize: '3.5rem', color: '#6366f1',
        marginBottom: '1.25rem', lineHeight: 1,
        textShadow: '0 0 30px #6366f1aa',
      }}>
        ✧
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "'Segoe UI Variable Display','Inter',system-ui",
        fontSize: '1.7rem', fontWeight: 700,
        color: '#f8fafc', letterSpacing: '-0.02em',
        marginBottom: '0.2rem',
      }}>
        {APP_NAME}
        <span style={{ color: '#6366f1', fontSize: '0.95rem', fontWeight: 400, marginLeft: '0.5rem' }}>
          {APP_VERSION}
        </span>
      </h1>

      {/* Sub */}
      <p style={{
        fontSize: '0.72rem', color: '#475569', marginBottom: '2.75rem',
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        {PROJECT_LABEL}
      </p>

      {/* Progress bar */}
      <div style={{ width: '300px', maxWidth: '86vw' }}>
        <div style={{
          width: '100%', height: '3px', borderRadius: '9999px',
          background: '#1e293b', overflow: 'hidden', marginBottom: '0.7rem',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            borderRadius: '9999px',
            background: 'linear-gradient(90deg, #4f46e5, #818cf8)',
            boxShadow: '0 0 10px #6366f1',
            transition: 'width 0.44s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
        <p style={{
          fontSize: '0.7rem', color: '#475569', textAlign: 'center',
          fontFamily: "'Consolas','Courier New',monospace",
        }}>
          {statusText}
        </p>
      </div>
    </div>
  )
}
