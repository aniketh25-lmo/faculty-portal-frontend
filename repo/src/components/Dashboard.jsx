import { useState } from 'react'
import DBHeartbeat from './DBHeartbeat'
import PipelineAuditFeed from './PipelineAuditFeed'
import { BACKEND_URL } from '../constants'

export default function Dashboard({ dbStatus }) {
  const [dlStatus, setDlStatus] = useState('')
  const [loading,  setLoading]  = useState(false)

  async function downloadReport() {
    setLoading(true)
    setDlStatus('Generating Excel from database...')
    try {
      const res = await fetch(`${BACKEND_URL}/export/publications`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = 'publications_master.xlsx'
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      setDlStatus('Download started ✔')
    } catch {
      setDlStatus('Download failed ❌  (backend may be cold-starting — try again in ~30s)')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 960, margin: '0 auto' }}>

      {/* ── Top row: DB status + Export card ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
        className="sm:grid-cols-2 grid-cols-1"
      >
        {/* DB Heartbeat */}
        <DBHeartbeat status={dbStatus} />

        {/* Export card */}
        <div style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          padding: '0.875rem 1.25rem',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', gap: '0.5rem',
        }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Consolidated Report
          </p>
          <button
            onClick={downloadReport}
            disabled={loading}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'var(--color-border)' : 'var(--color-accent)',
              color: '#fff', fontWeight: 600, fontSize: '0.82rem',
              transition: 'all 0.2s ease',
              alignSelf: 'flex-start',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.15)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
          >
            {loading ? 'Generating…' : '⬇ Download publications_master.xlsx'}
          </button>
          {dlStatus && (
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{dlStatus}</p>
          )}
        </div>
      </div>

      {/* ── Pipeline Audit Feed ── */}
      <div>
        <p style={{
          fontSize: '0.7rem', fontWeight: 600,
          color: 'var(--color-text-muted)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          marginBottom: '0.5rem',
        }}>
          Live Pipeline Audit Feed
        </p>
        <PipelineAuditFeed />
      </div>

      {/* ── System stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[
          { label: 'Data Sources',   value: '3',          sub: 'Scholar · Scopus · WoS' },
          { label: 'Pipeline Stages',value: '7',          sub: 'From input to export' },
          { label: 'Export Format',  value: '.xlsx',      sub: 'via pandas + openpyxl' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 14, padding: '1rem 1.25rem',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.15rem' }}>
              {s.value}
            </p>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.1rem' }}>{s.label}</p>
            <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
