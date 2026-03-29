import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import ExportModal from './ExportModal'
import { generateExcelReport } from '../utils/excel'

export default function FacultyDashboard({ profile }) {
  const [data, setData] = useState(null)
  const [rawAuthor, setRawAuthor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  useEffect(() => {
    async function fetchAnalytics() {
      if (!profile?.linked_author_id) return
      setLoading(true)
      
      const { data: analytics, error } = await supabase.rpc('get_faculty_analytics', { 
        target_author_id: profile.linked_author_id 
      })
      
      if (!error && analytics) {
        setData(analytics)
      } else {
        console.error("Error fetching analytics:", error)
      }

      // Also fetch the RAW master_authors record for the Excel profile sheet
      const { data: authorRow } = await supabase
        .from('master_authors')
        .select('*')
        .eq('id', profile.linked_author_id)
        .single()
      if (authorRow) setRawAuthor(authorRow)

      setLoading(false)
    }

    fetchAnalytics()
  }, [profile])


  if (loading) {
    return (
      <div className="slide-up" style={{ padding: '4rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ width: '40%', height: 30, background: 'var(--color-border)', borderRadius: 6, marginBottom: '1rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ width: '25%', height: 16, background: 'var(--color-border)', borderRadius: 4, marginBottom: '3rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 100, background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', animation: 'pulse 1.5s infinite ease-in-out' }} />)}
        </div>
        <div style={{ height: 300, background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <style>{`
          @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }
        `}</style>
      </div>
    )
  }

  if (!data || !data.identity) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>Error: Could not retrieve backend metrics.</div>
  }

  const { identity, kpis, impact_indexes, publication_history, all_publications = [] } = data

  const filteredPublications = all_publications
    .filter(p => 
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.source_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a,b) => (b.publication_year || 0) - (a.publication_year || 0))

  return (
    <div className="slide-up" style={{ padding: '3rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
      
      {/* ── Header Section ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.2rem', letterSpacing: '-0.02em' }}>
            {identity.canonical_name}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {identity.department} &bull; {identity.organization}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {identity.scholar_id && <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', padding: '0.25rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>Scholar</span>}
          {identity.scopus_id  && <span style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)', padding: '0.25rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>Scopus</span>}
          {identity.wos_id     && <span style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)', padding: '0.25rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>Web of Science</span>}
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Global Citations</p>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{kpis.scholar_citations}</div>
        </div>
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Scopus Outputs</p>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{kpis.scopus_documents}</div>
        </div>
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Peak H-Index</p>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981', lineHeight: 1 }}>{kpis.peak_h_index}</div>
        </div>
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Web of Science</p>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{kpis.wos_documents}</div>
        </div>
      </div>

      {/* ── Scopus Disclaimer ── */}
      <div style={{ background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.15)', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>⚠️</span>
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: '#fb923c' }}>Scopus Data Limitation:</strong> Due to restrictions imposed by the Scopus website, a maximum of 10 Scopus-indexed publications can be fetched per faculty profile. Paper URLs, individual citation counts, and other granular metadata from Scopus cannot be programmatically extracted. Scopus metrics in this dashboard may be incomplete.
        </p>
      </div>

      {/* ── Charts Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '1.5rem', fontWeight: 600 }}>Impact Indices by Platform</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={impact_indexes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="platform" stroke="#ffffff40" tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff40" tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: '#1c1c22', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: '0.8rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} iconType="circle" iconSize={8} />
                <Bar dataKey="H-Index" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="i10-Index" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '1.5rem', fontWeight: 600 }}>Research Velocity (Publications / Year)</h3>
          <div style={{ width: '100%', height: 260 }}>
            {publication_history.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={publication_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="year" stroke="#ffffff40" tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#ffffff40" tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1c1c22', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: '0.8rem' }} />
                  <Line type="monotone" dataKey="papers" name="Total Outputs" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No historical publication data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Master Publications Table ── */}
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, marginTop: '2.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--color-text)', marginBottom: '0.2rem', fontWeight: 600 }}>Master Publications Portfolio</h3>
              <button 
                onClick={() => setIsExportModalOpen(true)}
                style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
              >
                ↓ Honest College Report
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>Showing {filteredPublications.length} research outputs across all indexed platforms.</p>
          </div>
          <input 
            type="text" 
            placeholder="Search by title or journal..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)',
              padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.85rem', width: 280, outline: 'none', transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
          />
        </div>
        
        <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(28, 28, 34, 0.95)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
              <tr style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem 1.5rem', width: '60%', borderBottom: '1px solid var(--color-border)' }}>Publication</th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Year</th>
                <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Indices</th>
              </tr>
            </thead>
            <tbody>
              {filteredPublications.length > 0 ? filteredPublications.map((pub) => (
                <tr key={pub.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1.2rem 1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 500, marginBottom: '0.3rem', lineHeight: 1.4 }}>{pub.title}</div>
                    {pub.source_name && <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{pub.source_name}</div>}
                  </td>
                  <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{pub.publication_year || '—'}</td>
                  <td style={{ padding: '1.2rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {pub.in_scholar && <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '0.2rem 0.4rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600 }}>GS</span>}
                      {pub.in_scopus && <span style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#fb923c', padding: '0.2rem 0.4rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600 }}>Scopus</span>}
                      {pub.in_wos && <span style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', padding: '0.2rem 0.4rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600 }}>WoS</span>}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    No publications match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)}
        title={`Export ${identity?.canonical_name || 'Faculty'} Profile`}
        onExport={(filters) => {
          generateExcelReport(
            identity?.canonical_name,
            rawAuthor ? [rawAuthor] : [],
            all_publications,
            filters
          )
          setIsExportModalOpen(false)
        }}
      />
    </div>
  )
}
