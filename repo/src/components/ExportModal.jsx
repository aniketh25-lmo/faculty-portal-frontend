import { useState } from 'react'

const ALL_COLUMNS = [
  "Title",
  "Source / Journal",
  "Authors",
  "Publication Year",
  "Academic Year",
  "Department",
  "Volume / Issue / Pages",
  "WoS Category",
  "DOI",
  "Paper URL",
  "Publisher URL",
  "Abstract",
  "Scholar Citations",
  "Scopus Citations",
  "WoS Citations",
  "In Scholar",
  "In Scopus",
  "In WoS"
]

const PRESET_EXECUTIVE = [
  "Title", "Source / Journal", "Authors", "Publication Year", "Department"
]

const PRESET_CITATION = [
  "Title", "Publication Year", "Scholar Citations", "Scopus Citations", "WoS Citations"
]

export default function ExportModal({ isOpen, onClose, onExport, title, isLoading }) {
  const [platform, setPlatform] = useState('All')
  const [yearStart, setYearStart] = useState('')
  const [yearEnd, setYearEnd] = useState('')
  const [selectedColumns, setSelectedColumns] = useState(ALL_COLUMNS)
  const [categoryFilter, setCategoryFilter] = useState('All')

  if (!isOpen) return null

  function handleExport() {
    onExport({
      platform,
      category: categoryFilter, // Added category filter support
      yearStart: yearStart ? parseInt(yearStart) : null,
      yearEnd: yearEnd ? parseInt(yearEnd) : null,
      selectedColumns
    })
  }

  function toggleColumn(col) {
    if (selectedColumns.includes(col)) {
      setSelectedColumns(selectedColumns.filter(c => c !== col))
    } else {
      setSelectedColumns([...selectedColumns, col])
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 16,
        padding: '2rem', width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', animation: 'slide-up 0.2s ease-out'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {title || "Configure Export"}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.3rem', lineHeight: 1.5 }}>
              Customize your report attributes and filters before generating the Excel bundle.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
          
          {/* Left Column: Traditional Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Index Platform</label>
              <select 
                value={platform} 
                onChange={e => setPlatform(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-card)', color: 'var(--color-text)', fontSize: '0.9rem' }}
              >
                <option value="All">All Platforms (Combined)</option>
                <option value="Scholar">Google Scholar Only</option>
                <option value="Scopus">Scopus Only</option>
                <option value="WoS">Web of Science Only</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Publication Category</label>
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-card)', color: 'var(--color-text)', fontSize: '0.9rem' }}
              >
                <option value="All">All Categories</option>
                <option value="Journal">Journals</option>
                <option value="Conference">Conferences</option>
                <option value="Book_Chapter">Book Chapters</option>
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

          {/* Right Column: Column Selector & Presets */}
          <div style={{ background: 'var(--color-card)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--color-border)' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Excel Columns Setup</label>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button onClick={() => setSelectedColumns(ALL_COLUMNS)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>Full Dump</button>
              <button onClick={() => setSelectedColumns(PRESET_EXECUTIVE)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>Exec Summary</button>
              <button onClick={() => setSelectedColumns(PRESET_CITATION)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>Citation Audit</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {ALL_COLUMNS.map(col => (
                <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedColumns.includes(col)}
                    onChange={() => toggleColumn(col)}
                    style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                  />
                  {col}
                </label>
              ))}
            </div>
            {selectedColumns.length === 0 && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>Please select at least one column.</p>}
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
            disabled={isLoading || selectedColumns.length === 0}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: selectedColumns.length === 0 ? 0.5 : 1 }}
          >
            {isLoading ? 'Bundling...' : '↓ Generate & Download'}
          </button>
        </div>

      </div>
    </div>
  )
}
