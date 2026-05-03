import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell, Treemap, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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

  // --- Advanced Calculations ---
  const topPapers = [...all_publications]
    .sort((a,b) => ((b.scholar_citations || 0) + (b.scopus_citations || 0) + (b.wos_citations || 0)) - ((a.scholar_citations || 0) + (a.scopus_citations || 0) + (a.wos_citations || 0)))
    .slice(0, 3)

  const collaboratorCounts = {}
  all_publications.forEach(pub => {
    let authors = []
    if (pub.authors_list && Array.isArray(pub.authors_list)) {
      authors = pub.authors_list
    } else if (typeof pub.authors_list === 'string') {
      authors = pub.authors_list.split(/,|;/)
    }
    
    authors.forEach(author => {
      const cleaned = author.trim()
      // Exclude their own canonical name
      if (cleaned && cleaned.toLowerCase() !== identity.canonical_name.toLowerCase() && cleaned.length > 2) {
         collaboratorCounts[cleaned] = (collaboratorCounts[cleaned] || 0) + 1
      }
    })
  })

  const topCollaborators = Object.entries(collaboratorCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)

  // --- New Analytical Visualizations Data ---
  const scatterData = all_publications.map(p => ({
    year: p.publication_year || 0,
    citations: (p.scholar_citations || 0) + (p.scopus_citations || 0) + (p.wos_citations || 0),
    title: p.title
  })).filter(d => d.year > 0 && d.citations > 0)

  const venueCounts = {}
  all_publications.forEach(p => {
    if (p.source_name && p.source_name.trim()) {
      let venue = p.source_name.trim()
      if (venue.length > 25) venue = venue.substring(0, 25) + '...'
      venueCounts[venue] = (venueCounts[venue] || 0) + 1
    }
  })
  const topVenuesData = Object.entries(venueCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const citationDistributionData = [
    { name: 'Scholar', value: rawAuthor?.scholar_citations || 0, fill: '#3b82f6' },
    { name: 'Scopus', value: rawAuthor?.scopus_citations || 0, fill: '#f97316' },
    { name: 'WoS', value: rawAuthor?.wos_citations || 0, fill: '#a855f7' }
  ].filter(d => d.value > 0)

  const treemapData = topCollaborators.map(([name, count]) => ({ name, size: count }))

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e']


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
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {rawAuthor?.orcid && <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '0.25rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>ORCID: {rawAuthor.orcid}</span>}
          {identity.scholar_id && <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', padding: '0.25rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>Scholar</span>}
          {identity.scopus_id  && <span style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)', padding: '0.25rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>Scopus</span>}
          {identity.wos_id     && <span style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)', padding: '0.25rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>WoS</span>}
        </div>
      </div>

      {/* ── Advanced Platform Matrix ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        
        {/* Scholar Matrix */}
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem', borderTop: '4px solid #3b82f6' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--color-text)', fontWeight: 600, marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
            Google Scholar <span style={{ color: '#3b82f6', fontSize: '0.8rem' }}>{rawAuthor?.scholar_id || 'Not Linked'}</span>
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Citations</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{rawAuthor?.scholar_citations || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>H-Index (i10)</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{rawAuthor?.scholar_h_index || 0} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({rawAuthor?.scholar_i10_index || 0})</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Output</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{all_publications.filter(p => p.in_scholar).length}</span>
          </div>
        </div>

        {/* Scopus Matrix */}
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem', borderTop: '4px solid #f97316' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--color-text)', fontWeight: 600, marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
            Scopus <span style={{ color: '#f97316', fontSize: '0.8rem' }}>{rawAuthor?.scopus_id || 'Not Linked'}</span>
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Citations</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{rawAuthor?.scopus_citations || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>H-Index</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{rawAuthor?.scopus_h_index || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Output</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{all_publications.filter(p => p.in_scopus).length}</span>
          </div>
        </div>

        {/* WoS Matrix */}
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem', borderTop: '4px solid #a855f7' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--color-text)', fontWeight: 600, marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
            Web of Science <span style={{ color: '#a855f7', fontSize: '0.8rem' }}>{rawAuthor?.wos_id ? 'Linked' : 'Not Linked'}</span>
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Citations</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{rawAuthor?.wos_citations || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>H-Index</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{rawAuthor?.wos_h_index || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Output</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{all_publications.filter(p => p.in_wos).length}</span>
          </div>
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="platform" stroke="var(--color-border)" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--color-border)" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(128,128,128,0.05)' }} contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)', fontSize: '0.8rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px', color: 'var(--color-text-muted)' }} iconType="circle" iconSize={8} />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="year" stroke="var(--color-border)" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--color-border)" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)', fontSize: '0.8rem' }} />
                  <Line type="monotone" dataKey="papers" name="Total Outputs" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No historical publication data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Deep Analytics Section ── */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '3.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem' }}>Deep Analytics</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Scatter Plot */}
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '0.5rem', fontWeight: 600 }}>Publication Impact Map</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Spot high-impact "breakout" papers over time.</p>
          <div style={{ width: '100%', height: 260 }}>
            {scatterData.length > 0 ? (
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="year" type="number" name="Year" domain={['dataMin - 1', 'dataMax + 1']} tickCount={5} stroke="var(--color-border)" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="citations" type="number" name="Citations" stroke="var(--color-border)" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ZAxis dataKey="citations" range={[40, 400]} name="Impact" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)', fontSize: '0.8rem' }} />
                  <Scatter data={scatterData} fill="var(--color-accent)" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Insufficient citation data for scatter plot.</div>}
          </div>
        </div>

        {/* Citation Distribution */}
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '0.5rem', fontWeight: 600 }}>Citation Source Distribution</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Proportion of citations originating from each indexing platform.</p>
          <div style={{ width: '100%', height: 260 }}>
            {citationDistributionData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={citationDistributionData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value" stroke="var(--color-card)">
                    {citationDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)', fontSize: '0.8rem' }} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No citation data available.</div>}
          </div>
        </div>
      </div>

      {/* ── Advanced Insight Panels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '2.5rem' }}>
        
        {/* Top Collaborators Treemap */}
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.5rem', fontWeight: 600 }}>Frequent Collaborators Network</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Researchers commonly co-authoring with {identity.canonical_name}. Area indicates volume.</p>
          
          <div style={{ width: '100%', height: 200 }}>
            {treemapData.length > 0 ? (
              <ResponsiveContainer>
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="var(--color-card)"
                  fill="var(--color-accent)"
                  colorPanel={COLORS}
                >
                  <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)', fontSize: '0.8rem' }} />
                </Treemap>
              </ResponsiveContainer>
            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No recurring collaborators found.</div>}
          </div>
        </div>

        {/* Top Impact Research */}
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.5rem', fontWeight: 600 }}>Highest Impact Research</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Ranked by aggregate cumulative citations across all platforms.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {topPapers.length > 0 ? topPapers.map((paper, idx) => {
              const netCitations = (paper.scholar_citations || 0) + (paper.scopus_citations || 0) + (paper.wos_citations || 0)
              return (
                <div key={paper.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-accent-muted)', padding: '0.8rem', borderRadius: 8, gap: '1rem' }}>
                  <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>#{idx+1}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 500 }} title={paper.title}>{paper.title}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, flexShrink: 0 }}>{netCitations} Cites</span>
                </div>
              )
            }) : <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No publications available.</div>}
          </div>
        </div>

        {/* Top Venues Bar Chart */}
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.5rem', fontWeight: 600 }}>Top Publishing Venues</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Journals and conferences with the most publications.</p>
          
          <div style={{ width: '100%', height: 260 }}>
            {topVenuesData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={topVenuesData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--color-border)" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={200} stroke="var(--color-border)" tick={{ fill: 'var(--color-text)', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(128,128,128,0.05)' }} contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)', fontSize: '0.8rem' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No venue data available.</div>}
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
            <thead style={{ position: 'sticky', top: 0, background: 'var(--color-header-bg)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
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
          
          if (profile && profile.id) {
            supabase.from('notifications').insert({
              user_id: profile.id,
              title: 'Export Complete',
              message: 'Your personal Excel Report has been generated successfully.',
              type: 'success'
            }).then()
          }
        }}
      />
    </div>
  )
}
