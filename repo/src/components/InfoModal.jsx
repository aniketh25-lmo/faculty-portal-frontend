import { APP_NAME, APP_VERSION, PROJECT_LABEL } from '../constants'

const STAGES = [
  { n: 1, icon: '📋', title: 'Faculty Input',          desc: 'Load faculty roster and department config from local JSON/CSV.' },
  { n: 2, icon: '🔍', title: 'Scholar Engine',         desc: 'Google Scholar scraping — publications, citations, h-index.' },
  { n: 3, icon: '📖', title: 'Scopus Integration',     desc: 'Elsevier API — DOI resolution, journal metrics, SNIP/SJR.' },
  { n: 4, icon: '🌐', title: 'Web of Science',         desc: 'Clarivate cross-index — impact factors and conference data.' },
  { n: 5, icon: '🔄', title: 'Normalization',          desc: 'Deduplication, name disambiguation, and quality scoring.' },
  { n: 6, icon: '☁️', title: 'Supabase Push',          desc: 'Upsert consolidated records into publications_master table.' },
  { n: 7, icon: '📊', title: 'Export Pipeline',        desc: 'FastAPI streams .xlsx via pandas/openpyxl to the browser.' },
]

export default function InfoModal({ onClose }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div className="modal-in" style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 18, width: '100%', maxWidth: 580,
        maxHeight: '90vh', overflowY: 'auto',
        padding: '1.75rem',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span className="sparkle-animate" style={{ color: 'var(--color-accent)', fontSize: '1.2rem' }}>✧</span>
              <h2 style={{
                fontFamily: "'Segoe UI Variable Display','Inter',system-ui",
                fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)',
              }}>
                {APP_NAME} {APP_VERSION}
              </h2>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{PROJECT_LABEL}</p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', fontSize: '1.2rem', lineHeight: 1,
            padding: '2px 6px', borderRadius: 6, transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            ✕
          </button>
        </div>

        {/* Credits */}
        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 12, padding: '0.875rem 1rem',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem',
        }}>
          {[
            ['Institution', 'VNR VJIET, Hyderabad'],
            ['Department',  'CSE — Major Project'],
            ['Academic Year','2025 – 2026'],
            ['Stack',       'Python · FastAPI · React · Supabase'],
          ].map(([k, v]) => (
            <div key={k}>
              <p style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>{k}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text)', fontWeight: 500 }}>{v}</p>
            </div>
          ))}
        </div>

        {/* 7-Stage architecture */}
        <div>
          <p style={{
            fontSize: '0.68rem', fontWeight: 600,
            color: 'var(--color-text-muted)', letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: '0.75rem',
          }}>
            7-Stage Processing Architecture
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {STAGES.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                {/* Stage connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--color-accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {s.n}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 10, background: 'var(--color-border)', borderRadius: 2, marginTop: 3 }} />
                  )}
                </div>
                {/* Stage content */}
                <div style={{ paddingBottom: i < STAGES.length - 1 ? '0.4rem' : 0 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.1rem' }}>
                    {s.icon} {s.title}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
