import { useState } from 'react'

const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'scholar',   icon: '🎓', label: 'Scholar Engine' },
]

const DOT_COLOR = { active: '#10b981', connecting: '#f59e0b', offline: '#ef4444' }
const DOT_LABEL = { active: 'SUPABASE ACTIVE', connecting: 'CONNECTING...', offline: 'SUPABASE OFFLINE' }

export default function Sidebar({
  collapsed, onToggleCollapse,
  mobileOpen,
  activePage, onNavigate,
  onInfoClick, dbStatus,
}) {
  const [hovered, setHovered] = useState(null)
  const W = collapsed ? 64 : 260

  const inner = (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--color-sidebar)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      transition: 'background 0.3s ease, border-color 0.3s ease',
      overflow: 'hidden',
    }}>
      {/* ── Logo row ── */}
      <div style={{
        height: 60, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0 0' : '0 1rem',
        borderBottom: '1px solid var(--color-border)',
        gap: '0.5rem',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="sparkle-animate" style={{ color: 'var(--color-accent)', fontSize: '1.3rem' }}>✧</span>
            <span style={{
              fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--color-text)', whiteSpace: 'nowrap',
            }}>Analytics</span>
          </div>
        )}
        {collapsed && (
          <span className="sparkle-animate" style={{ color: 'var(--color-accent)', fontSize: '1.3rem' }}>✧</span>
        )}
        <button onClick={onToggleCollapse} title={collapsed ? 'Expand' : 'Collapse'} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', fontSize: '0.8rem', padding: '4px',
          borderRadius: 6, display: 'flex', alignItems: 'center',
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const active = activePage === item.id
          const hover  = hovered === item.id
          return (
            <button key={item.id}
              onClick={() => onNavigate(item.id)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              title={collapsed ? item.label : ''}
              style={{
                width: '100%', border: 'none', borderRadius: 10, cursor: 'pointer',
                padding: collapsed ? '0.75rem 0' : '0.65rem 0.875rem',
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : '0.7rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? 'var(--color-accent)' : hover ? 'var(--color-accent-muted)' : 'transparent',
                color: active ? '#fff' : 'var(--color-text)',
                fontWeight: active ? 600 : 400,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '1.05rem' }}>{item.icon}</span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* ── DB Heartbeat mini ── */}
      <div style={{
        padding: '0.65rem',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '0.5rem',
      }}>
        <div className={dbStatus === 'active' ? 'dot-pulse' : ''} style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: DOT_COLOR[dbStatus] || '#94a3b8',
        }} />
        {!collapsed && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 600,
            color: DOT_COLOR[dbStatus] || '#94a3b8',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            fontFamily: "'Consolas','Courier New',monospace",
          }}>
            {DOT_LABEL[dbStatus]}
          </span>
        )}
      </div>

      {/* ── Info button ── */}
      <div style={{ padding: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
        <button onClick={onInfoClick} style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', borderRadius: 8, padding: '0.5rem',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '0.5rem', fontSize: '0.8rem',
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          <span style={{ fontSize: '1rem' }}>ⓘ</span>
          {!collapsed && <span>System Info</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop — width animates between 64px and 260px */}
      <div style={{
        width: W, height: '100vh', flexShrink: 0,
        transition: 'width 0.3s ease',
        position: 'relative', zIndex: 10,
      }}>
        {inner}
      </div>

      {/* Mobile overlay */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 30,
        width: 260,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
      }}>
        {inner}
      </div>
    </>
  )
}
