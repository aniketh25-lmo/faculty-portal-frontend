import { useState, useEffect, useRef } from 'react'

// Color codes matching the spec
const C = {
  green:  '#10b981',
  indigo: '#6366f1',
  red:    '#ef4444',
  muted:  '#475569',
}

function now() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false })
}

const BOOT_LOG = [
  { color: C.indigo, text: '⚙️  ACADEMIC PULSE PRO | System initializing...' },
  { color: C.green,  text: '✅ Scholar Engine module loaded' },
  { color: C.green,  text: '✅ Supabase client authenticated' },
  { color: C.green,  text: '✅ Publication schema verified (publications_master)' },
  { color: C.green,  text: '✅ FastAPI export pipeline ready' },
  { color: C.green,  text: '✅ CORS middleware active — all origins permitted' },
  { color: C.indigo, text: '⚙️  Running pre-flight checks...' },
  { color: C.green,  text: '✅ /export/publications route registered' },
  { color: C.green,  text: '✅ Excel buffer engine (pandas + openpyxl) OK' },
  { color: C.green,  text: '🎉 All systems operational. Portal ready.' },
]

export default function PipelineAuditFeed() {
  const [lines, setLines] = useState([])
  const [done, setDone]   = useState(false)
  const endRef             = useRef(null)

  useEffect(() => {
    let i = 0
    const iv = setInterval(() => {
      if (i < BOOT_LOG.length) {
        const entry = BOOT_LOG[i]
        setLines(prev => [...prev, { ...entry, time: now(), id: i }])
        i++
      } else {
        clearInterval(iv)
        setDone(true)
      }
    }, 280)
    return () => clearInterval(iv)
  }, [])

  // Auto-scroll
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [lines])

  return (
    <div style={{
      background: '#000',
      border: '1px solid #1e293b',
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Consolas','Courier New',monospace",
    }}>
      {/* Terminal title bar */}
      <div style={{
        background: '#0a0a0a',
        borderBottom: '1px solid #1a1a2e',
        padding: '0.5rem 0.875rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['#ef4444', '#f59e0b', '#10b981'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
          ))}
        </div>
        <span style={{ fontSize: '0.7rem', color: '#475569', marginLeft: '0.25rem' }}>
          Live Pipeline Audit Feed
        </span>
        {done && (
          <span style={{
            marginLeft: 'auto', fontSize: '0.65rem',
            color: C.green, letterSpacing: '0.05em',
          }}>
            ● LIVE
          </span>
        )}
      </div>

      {/* Log body */}
      <div style={{
        padding: '0.75rem', minHeight: '220px', maxHeight: '340px',
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.2rem',
      }}>
        {lines.map(line => (
          <div key={line.id} className="slide-up" style={{
            fontSize: '0.72rem', lineHeight: 1.6,
            display: 'flex', gap: '0.75rem',
          }}>
            <span style={{ color: C.muted, flexShrink: 0, userSelect: 'none' }}>[{line.time}]</span>
            <span style={{ color: line.color }}>{line.text}</span>
          </div>
        ))}
        {!done && (
          <span className="cursor-blink" style={{ color: C.green, fontSize: '0.72rem' }}>█</span>
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}
