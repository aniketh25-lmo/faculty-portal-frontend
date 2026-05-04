import { APP_NAME, SCRAPER_URL } from '../constants'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import NotificationsMenu from './NotificationsMenu'

const DOT_COLOR = { active: '#10b981', connecting: '#f59e0b', offline: '#ef4444' }
const DOT_LABEL = { active: 'DB ACTIVE', connecting: 'CONNECTING', offline: 'DB OFFLINE' }

export default function Header({ theme, onThemeToggle, onInfoClick, dbStatus, session, profile, isSuperadmin, onLogout }) {
  const location = useLocation()
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <header style={{
      height: 56, flexShrink: 0,
      background: 'var(--color-header-bg)',
      borderBottom: '1px solid var(--color-border)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center',
      padding: '0 1.5rem',
      gap: '0.75rem',
      transition: 'background 0.3s ease, border-color 0.3s ease',
      position: 'relative', zIndex: 1000,
    }}>
      {/* Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="sparkle-animate" style={{ color: 'var(--color-accent)', fontSize: '1.1rem' }}>✧</span>
          <span style={{
            fontFamily: "'Segoe UI Variable Display','Inter',system-ui",
            fontWeight: 700, fontSize: '0.8rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--color-text)',
          }}>
            {APP_NAME}
          </span>
        </Link>
      </div>

      {/* DB Heartbeat pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 20, padding: '0.25rem 0.65rem',
        transition: 'all 0.3s ease',
      }}>
        <div
          className={dbStatus === 'active' ? 'dot-pulse' : ''}
          style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: DOT_COLOR[dbStatus] || '#94a3b8',
            boxShadow: dbStatus === 'active' ? `0 0 6px ${DOT_COLOR.active}` : 'none',
          }}
        />
        <span style={{
          fontSize: '0.62rem', fontWeight: 600,
          color: DOT_COLOR[dbStatus] || '#94a3b8',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          fontFamily: "'Consolas','Courier New',monospace",
          whiteSpace: 'nowrap',
        }}>
          {DOT_LABEL[dbStatus]}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        
        {location.pathname !== '/' && (
          <div style={{ position: 'relative' }}>
            <a 
              href={SCRAPER_URL} 
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-bg)', 
                background: 'var(--color-text)', textDecoration: 'none',
                padding: '0.4rem 0.8rem', borderRadius: 20, transition: 'transform 0.2s',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; setShowTooltip(true); }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; setShowTooltip(false); }}
            >
              ⬇ Download Scraper
            </a>

            {showTooltip && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 14px)', right: 0, width: 320,
                background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 12,
                padding: '1.25rem', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', zIndex: 100,
                animation: 'slide-up 0.2s ease-out'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Desktop Tool
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.6rem' }}>
                  AcademicPulsePro <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#10b981', marginLeft: '0.3rem' }}>v6.0</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  Run the scraper locally to pull publications from all sources and sync them to the cloud database.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auth Navigation & State */}
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            
            <div style={{ display: 'flex', gap: '0.8rem', marginRight: '0.5rem' }}>
              
              {!(profile?.role === 'admin' && !profile?.linked_author_id) && (
                <Link to="/dashboard" style={{
                  fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textDecoration: 'none',
                  padding: '0.35rem 0.6rem', borderRadius: 8, transition: 'all 0.2s', border: '1px solid transparent'
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.background = 'var(--color-card)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent' }}
                >
                  My Analytics
                </Link>
              )}

              {profile?.linked_author_id && (
                <Link to="/profile" style={{
                  fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textDecoration: 'none',
                  padding: '0.35rem 0.6rem', borderRadius: 8, transition: 'all 0.2s', border: '1px solid transparent'
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.background = 'var(--color-card)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent' }}
                >
                  My Profile
                </Link>
              )}

              {profile?.role === 'admin' && (
                <Link to="/admin" style={{
                  fontSize: '0.75rem', fontWeight: 600, color: '#10b981', textDecoration: 'none',
                  padding: '0.35rem 0.6rem', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, transition: 'all 0.2s', background: 'rgba(16, 185, 129, 0.05)'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)' }}
                >
                  Admin Hub
                </Link>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--color-border)' }}>
              <img 
                src={session.user.user_metadata.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} 
                alt="Avatar" 
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }}
              />
              <button 
                onClick={onLogout}
                style={{
                  background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)',
                  fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.6rem', borderRadius: 6,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
              >
                Sign Out
              </button>
            </div>
            
          </div>
        )}

        <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 0.2rem' }} />

        {/* Info button */}
        <button onClick={onInfoClick} title="System Info" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', fontSize: '1rem',
          width: 34, height: 34, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          ⓘ
        </button>

        {session && profile && <NotificationsMenu profile={profile} />}

        {/* Theme toggle */}
        <button onClick={onThemeToggle} title="Toggle theme" style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 8, cursor: 'pointer',
          width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.95rem', transition: 'all 0.2s ease',
          color: 'var(--color-text)',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
