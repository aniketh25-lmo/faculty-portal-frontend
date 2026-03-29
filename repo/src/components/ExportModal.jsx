import { useState } from 'react'

export default function ExportModal({ isOpen, onClose, onExport, title, isLoading }) {
  const [platform, setPlatform] = useState('All')
  const [yearStart, setYearStart] = useState('')
  const [yearEnd, setYearEnd] = useState('')

  if (!isOpen) return null

  function handleExport() {
    onExport({
      platform,
      yearStart: yearStart ? parseInt(yearStart) : null,
      yearEnd: yearEnd ? parseInt(yearEnd) : null
    })
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 16,
        padding: '2rem', width: '100%', maxWidth: 420,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', animation: 'slide-up 0.2s ease-out'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {title || "Configure Export"}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.3rem', lineHeight: 1.5 }}>
              Strict categorization will be instantly applied before generating your Excel spreadsheet.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* Global Filter Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Index Filter</label>
            <select 
              value={platform} 
              onChange={e => setPlatform(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-card)', color: 'var(--color-text)', fontSize: '0.9rem' }}
            >
              <option value="All">All Publications (Combined)</option>
              <option value="Scholar">Google Scholar Only</option>
              <option value="Scopus">Scopus Only</option>
              <option value="WoS">Web of Science Only</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>From Year</label>
              <input 
                type="number" 
                placeholder="e.g. 2018"
                value={yearStart} 
                onChange={e => setYearStart(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-card)', color: 'var(--color-text)', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>To Year</label>
              <input 
                type="number" 
                placeholder="e.g. 2024"
                value={yearEnd} 
                onChange={e => setYearEnd(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-card)', color: 'var(--color-text)', fontSize: '0.9rem' }}
              />
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2.5rem' }}>
          <button 
            onClick={onClose}
            disabled={isLoading}
            style={{ padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleExport}
            disabled={isLoading}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isLoading ? 'Bundling...' : '↓ Generate & Download'}
          </button>
        </div>

      </div>
    </div>
  )
}
