const DOT_COLOR = { active: '#10b981', connecting: '#f59e0b', offline: '#ef4444' }
const DOT_CLASS = { active: 'dot-pulse', connecting: '', offline: '' }
const LABEL     = { active: 'SUPABASE ACTIVE', connecting: 'CONNECTING...', offline: 'SUPABASE OFFLINE' }
const SUB       = {
  active:     'Remote database link established',
  connecting: 'Attempting to reach backend service...',
  offline:    'Backend unreachable — may be cold-starting',
}

export default function DBHeartbeat({ status }) {
  const color = DOT_COLOR[status] || '#94a3b8'

  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 14,
      padding: '0.875rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      transition: 'all 0.3s ease',
    }}>
      {/* Glow dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {/* Outer glow */}
        <div style={{
          position: 'absolute', inset: -4,
          borderRadius: '50%',
          background: color,
          opacity: 0.15,
        }} />
        <div className={DOT_CLASS[status]} style={{
          width: 10, height: 10, borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }} />
      </div>

      {/* Text */}
      <div>
        <p style={{
          fontSize: '0.7rem', fontWeight: 700,
          color, letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontFamily: "'Consolas','Courier New',monospace",
          marginBottom: '0.1rem',
        }}>
          {LABEL[status]}
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
          {SUB[status]}
        </p>
      </div>
    </div>
  )
}
