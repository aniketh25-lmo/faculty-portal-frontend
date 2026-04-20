import { SCRAPER_URL } from '../constants'

const FEATURES = [
  { icon: '🔍', title: 'Google Scholar Engine',  desc: 'Automated extraction of publications, citations, and h-index data for each faculty member.' },
  { icon: '📖', title: 'Scopus Integration',      desc: 'API-based retrieval of peer-reviewed papers with DOI, journal ranking, and citation metrics.' },
  { icon: '🌐', title: 'Web of Science',          desc: 'Cross-referenced indexing from WoS for comprehensive publication coverage.' },
  { icon: '🔄', title: 'Smart Deduplication',     desc: 'Intelligent normalization pipeline that merges duplicate records across all three sources.' },
  { icon: '☁️', title: 'Supabase Sync',           desc: 'Pushes consolidated data to the cloud database in real-time for immediate portal access.' },
  { icon: '📊', title: '7-Stage Pipeline',        desc: 'From faculty input config to Excel export — a fully automated end-to-end workflow.' },
]

export default function ScholarEngine() {
  return (
    <div className="slide-up" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Hero card */}
      <div style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 18, padding: '2rem',
        display: 'flex', flexDirection: 'column', gap: '1rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background accent glow */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: 'var(--color-accent)', opacity: 0.06,
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <span className="sparkle-animate" style={{ fontSize: '2.5rem', color: 'var(--color-accent)', lineHeight: 1 }}>✧</span>
          <div>
            <h2 style={{
              fontFamily: "'Segoe UI Variable Display','Inter',system-ui",
              fontSize: '1.5rem', fontWeight: 700,
              color: 'var(--color-text)', marginBottom: '0.25rem',
            }}>
              AcademicPulsePro
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-accent)', marginLeft: '0.6rem' }}>v5.0</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.65, maxWidth: 560 }}>
              A desktop-grade research intelligence tool that scrapes, consolidates, and pushes
              faculty publication data from Google Scholar, Scopus, and Web of Science into the
              Supabase cloud database — powering this portal's reports.
            </p>
          </div>
        </div>

        {/* Download button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <a href={SCRAPER_URL} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.4rem', borderRadius: 12,
            background: 'var(--color-accent)', color: '#fff',
            fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
            transition: 'filter 0.2s ease',
            boxShadow: '0 4px 20px var(--color-accent-muted)',
          }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          >
            ⬇ Download AcademicPulsePro.exe
          </a>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            Windows • v5.0 • GitHub Releases
          </span>
        </div>
      </div>

      {/* Features grid */}
      <div>
        <p style={{
          fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--color-text-muted)',
          marginBottom: '0.75rem',
        }}>
          Key Capabilities
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.875rem' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 14, padding: '1rem 1.1rem',
              transition: 'border-color 0.2s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{f.icon}</div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>{f.title}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
