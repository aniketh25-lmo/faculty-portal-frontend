import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BACKEND_URL, SCRAPER_URL } from '../constants'

const FEATURES = [
  { icon: '🔍', title: 'Google Scholar Engine', desc: 'Automated extraction of publications, citations, and h-index data for each faculty member.' },
  { icon: '📖', title: 'Scopus Integration', desc: 'API-based retrieval of peer-reviewed papers with DOI, journal ranking, and citation metrics.' },
  { icon: '🌐', title: 'Web of Science', desc: 'Cross-referenced indexing for comprehensive publication coverage across global databases.' },
  { icon: '🔄', title: 'Smart Deduplication', desc: 'Intelligent normalization pipeline that merges duplicate records across all three sources.' },
  { icon: '☁️', title: 'Supabase Sync', desc: 'Pushes consolidated data to the cloud database in real-time for immediate portal access.' },
  { icon: '📊', title: '7-Stage Pipeline', desc: 'From faculty input config to Excel export — a fully automated, end-to-end workflow.' },
]

export default function HomePage({ session, profile }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 1.5rem 3rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── Hero ── */}
      <div className="slide-up" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div className="sparkle-animate" style={{
          fontSize: '3rem', color: 'var(--color-accent)', lineHeight: 1,
          filter: 'drop-shadow(0 0 16px var(--color-accent))',
        }}>
          ✧
        </div>
        <h1 style={{
          fontFamily: "'Segoe UI Variable Display','Inter',system-ui",
          fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
          fontWeight: 700, color: 'var(--color-text)',
          letterSpacing: '-0.02em', lineHeight: 1.2,
        }}>
          Academic Publication Intelligence
        </h1>
        <p style={{
          fontSize: '0.9rem', color: 'var(--color-text-muted)',
          lineHeight: 1.7, maxWidth: 520,
        }}>
          Automated extraction, consolidation, and analytics of faculty research
          publications from Google Scholar, Scopus, and Web of Science.
        </p>
      </div>

      {/* ── Action cards ── */}
      <div className="slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>

        {/* Download EXE */}
        <div style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 16, padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
          transition: 'border-color 0.2s',
          position: 'relative', overflow: 'hidden',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 120, height: 120, borderRadius: '50%',
            background: 'var(--color-accent)', opacity: 0.07,
            filter: 'blur(30px)', pointerEvents: 'none',
          }} />
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
              Desktop Tool
            </p>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
              AcademicPulsePro
              <span style={{ fontSize: '0.72rem', color: 'var(--color-accent)', fontWeight: 400, marginLeft: '0.4rem' }}>v6.0</span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Run the scraper locally to pull publications from all sources and sync them to the cloud database.
            </p>
          </div>
          <a href={SCRAPER_URL} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.6rem 1.1rem', borderRadius: 10,
            background: 'var(--color-accent)', color: '#fff',
            fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none',
            alignSelf: 'flex-start', transition: 'filter 0.2s ease',
            boxShadow: '0 4px 16px var(--color-accent-muted)',
            marginTop: '0.5rem',
          }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          >
            ⬇ Download .exe
          </a>
        </div>

        {/* Portal Login */}
        <div style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 16, padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
          transition: 'border-color 0.2s',
          position: 'relative', overflow: 'hidden',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 120, height: 120, borderRadius: '50%',
            background: '#8b5cf6', opacity: 0.07,
            filter: 'blur(30px)', pointerEvents: 'none',
          }} />
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
              Web Portal
            </p>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
              Administration & Dashboards
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              {!session
                ? "Log in to view your consolidated research profile, citation metrics, and departmental statistics."
                : "Securely authenticated. Enter the active portal to view institutional metrics and your personal dashboard."}
            </p>
          </div>

          {!session ? (
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.6rem 1.1rem', borderRadius: 10,
              background: '#8b5cf6', color: '#fff',
              fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none',
              alignSelf: 'flex-start', transition: 'filter 0.2s ease',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
              marginTop: '0.5rem',
            }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              Register / Login ➔
            </Link>
          ) : (
            <Link
              to={profile?.role === 'admin' && !profile?.linked_author_id ? "/admin" : "/dashboard"}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.6rem 1.1rem', borderRadius: 10,
                background: '#10b981', color: '#fff',
                fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none',
                alignSelf: 'flex-start', transition: 'filter 0.2s ease',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                marginTop: '0.5rem',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              Enter Portal ➔
            </Link>
          )}

        </div>
      </div>

      {/* ── Features ── */}
      <div className="slide-up">
        <p style={{
          fontSize: '0.68rem', fontWeight: 600,
          color: 'var(--color-text-muted)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: '0.875rem',
        }}>
          Key Capabilities — AcademicPulsePro
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 14, padding: '1rem 1.1rem',
              transition: 'border-color 0.2s ease, transform 0.15s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>{f.icon}</div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>{f.title}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
        © 2026 Faculty Research Analytics System · VNR VJIET
      </p>
    </div>
  )
}
