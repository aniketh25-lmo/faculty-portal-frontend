import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import ExportModal from './ExportModal'
import FacultyDashboard from './FacultyDashboard'
import { generateExcelReport } from '../utils/excel'

const COLORS = ['#3b82f6', '#f97316', '#a855f7'] // Scholar, Scopus, WoS

export default function AdminDashboard({ profile, isSuperadmin }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'analytics'

  const setActiveTab = (tabValue) => {
    setSearchParams({ tab: tabValue })
  }
  
  const [claims, setClaims] = useState([])
  const [claimsLoading, setClaimsLoading] = useState(true)

  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  const [globalAuthors, setGlobalAuthors] = useState([])
  const [globalPubs, setGlobalPubs] = useState([])
  const [advancedAnalyticsLoading, setAdvancedAnalyticsLoading] = useState(true)

  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // ── Connections tab state ──────────────────────────────────────
  const [connections, setConnections] = useState([])
  const [connectionsLoading, setConnectionsLoading] = useState(false)

  // ── View-as-Author state ───────────────────────────────────────
  const [impersonatedProfile, setImpersonatedProfile] = useState(null)

  // ── Danger Zone state ──────────────────────────────────────────
  const [clearMasterLoading, setClearMasterLoading] = useState(false)
  const [clearDbLoading, setClearDbLoading] = useState(false)
  const [clearDbConfirmText, setClearDbConfirmText] = useState('')

  useEffect(() => {
    fetchClaims()
    fetchSystemAnalytics()
    fetchAdvancedGlobalData()

    // Real-time synchronization for Admin Identity Claims
    const channel = supabase.channel('admin-claims-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profile_claims' },
        () => { fetchClaims() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Fetch connections whenever that tab is activated
  useEffect(() => {
    if (activeTab === 'connections') fetchConnections()
  }, [activeTab])

  async function fetchClaims() {
    const { data: claimsData, error: claimsError } = await supabase
      .from('profile_claims')
      .select(`id, created_at, status, master_author_id, profile_id`)
      .in('status', ['pending', 'detach_pending'])
      .order('created_at', { ascending: false })
    
    if (claimsError) {
      console.error("Admin fetchClaims Error:", claimsError)
      setClaims([])
      setClaimsLoading(false)
      return
    }

    const authorIds = (claimsData || []).map(c => c.master_author_id).filter(Boolean)
    let authorsMap = {}
    if (authorIds.length > 0) {
      const { data: authorsData } = await supabase
        .from('master_authors')
        .select('id, canonical_name, department')
        .in('id', authorIds)
        
      if (authorsData) {
        authorsData.forEach(a => authorsMap[a.id] = a)
      }
    }

    const profileIds = (claimsData || []).map(c => c.profile_id).filter(Boolean)
    let profilesMap = {}
    if (profileIds.length > 0) {
      const { data: profsData } = await supabase.from('profiles').select('id, email').in('id', profileIds)
      if (profsData) profsData.forEach(p => profilesMap[p.id] = p)
    }

    const formattedClaims = (claimsData || []).map(c => ({
      ...c,
      master_authors: authorsMap[c.master_author_id] || null,
      profiles: profilesMap[c.profile_id] || null
    }))

    setClaims(formattedClaims)
    setClaimsLoading(false)
  }

  async function fetchConnections() {
    setConnectionsLoading(true)
    
    // Fetch only approved claims from profile_claims table
    const { data: claimsData, error: claimsError } = await supabase
      .from('profile_claims')
      .select(`id, created_at, master_author_id, profile_id`)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (claimsError) {
      console.error("fetchConnections Error:", claimsError)
      setConnections([])
      setConnectionsLoading(false)
      return
    }

    const authorIds = (claimsData || []).map(c => c.master_author_id).filter(Boolean)
    let authorsMap = {}
    if (authorIds.length > 0) {
      const { data: authorsData } = await supabase
        .from('master_authors')
        .select('id, canonical_name, department, scholar_id, scopus_id, wos_id')
        .in('id', authorIds)
        
      if (authorsData) {
        authorsData.forEach(a => authorsMap[a.id] = a)
      }
    }

    const profileIds = (claimsData || []).map(c => c.profile_id).filter(Boolean)
    let profilesMap = {}
    if (profileIds.length > 0) {
      const { data: profsData } = await supabase.from('profiles').select('id, email').in('id', profileIds)
      if (profsData) profsData.forEach(p => profilesMap[p.id] = p)
    }

    const formattedConnections = (claimsData || []).map(c => ({
      id: c.id,
      email: profilesMap[c.profile_id]?.email || 'Unknown Email',
      created_at: c.created_at,
      master_authors: authorsMap[c.master_author_id] || null
    }))

    setConnections(formattedConnections)
    setConnectionsLoading(false)
  }

  async function fetchSystemAnalytics() {
    setAnalyticsLoading(true)
    const { data, error } = await supabase.rpc('get_system_analytics')
    if (!error && data) setAnalytics(data)
    setAnalyticsLoading(false)
  }

  async function fetchAdvancedGlobalData() {
    setAdvancedAnalyticsLoading(true)
    const [pubRes, authorRes] = await Promise.all([
      supabase.from('master_publications').select('*'),
      supabase.from('master_authors').select('*')
    ])
    if (pubRes.data) setGlobalPubs(pubRes.data)
    if (authorRes.data) setGlobalAuthors(authorRes.data)
    setAdvancedAnalyticsLoading(false)
  }

  async function handleApprove(claimId) {
    if (!confirm('Approve this claim? This will grant the user access to this profile.')) return
    const { error } = await supabase.rpc('approve_claim', { target_claim_id: claimId })
    if (error) alert(`Error: ${error.message}`)
    else setClaims(c => c.filter(x => x.id !== claimId))
  }

  async function handleReject(claimId) {
    if (!confirm('Reject this claim?')) return
    const { error } = await supabase.rpc('reject_claim', { target_claim_id: claimId })
    if (error) alert(`Error: ${error.message}`)
    else setClaims(c => c.filter(x => x.id !== claimId))
  }

  async function handleApproveDetach(claimId) {
    if (!confirm('Approve detachment? The user will be permanently unlinked from this author profile.')) return
    const { error } = await supabase.rpc('approve_detach_claim', { target_claim_id: claimId })
    if (error) {
      alert(`Error: RPC 'approve_detach_claim' failed or is missing. Please run the migration script. Details: ${error.message}`)
    } else {
      setClaims(c => c.filter(x => x.id !== claimId))
      fetchConnections()
    }
  }

  async function handleGlobalExport(filters) {
    setIsExporting(true)
    try {
      const [pubRes, authorRes] = await Promise.all([
        supabase.from('master_publications').select('*'),
        supabase.from('master_authors').select('*')
      ])
      if (pubRes.error) throw pubRes.error
      if (authorRes.error) throw authorRes.error
      generateExcelReport("VNR VJIET — CSE Institutional Report", authorRes.data || [], pubRes.data || [], filters)
      setIsExportModalOpen(false)
    } catch (err) {
      alert("Failed to export database: " + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  // ── Danger Zone Handlers ─────────────────────────────────────
  async function handleClearMaster() {
    if (!confirm('⚠️ This will permanently delete ALL records from master_publications. Are you sure?')) return
    setClearMasterLoading(true)
    const { error } = await supabase.rpc('clear_master_publications')
    setClearMasterLoading(false)
    if (error) alert('Error: ' + error.message)
    else {
      alert('✅ master_publications cleared successfully.')
      fetchAdvancedGlobalData()
      fetchSystemAnalytics()
    }
  }

  async function handleClearDb() {
    if (clearDbConfirmText.trim().toLowerCase() !== 'i understand') {
      alert('Please type "I understand" to confirm this action.')
      return
    }
    setClearDbLoading(true)
    const { error } = await supabase.rpc('clear_research_data')
    setClearDbLoading(false)
    if (error) alert('Error: ' + error.message)
    else {
      setClearDbConfirmText('')
      alert('✅ All research data (master_authors + master_publications) has been cleared.')
      fetchAdvancedGlobalData()
      fetchSystemAnalytics()
    }
  }

  // Shared tab button style helper
  const tabStyle = (name) => ({
    background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: 600,
    color: activeTab === name ? 'var(--color-text)' : 'var(--color-text-muted)',
    borderBottom: activeTab === name ? '2px solid var(--color-accent)' : '2px solid transparent',
    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
  })

  return (
    <div className="slide-up" style={{ padding: '3rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.2rem', letterSpacing: '-0.02em' }}>Institutional Admin Hub</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Global performance metrics and identity management.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c4b5fd', padding: '0.45rem 1rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'}
          >
            ↓ Global Database Excel
          </button>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '0.35rem 0.8rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
            {isSuperadmin ? '⚡ Superadmin' : 'Admin Mode'}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2.5rem', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('analytics')} style={tabStyle('analytics')}>
          Performance Overview
        </button>
        <button onClick={() => setActiveTab('claims')} style={tabStyle('claims')}>
          Identity Claims
          {claims.length > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 20 }}>{claims.length}</span>
          )}
        </button>

        {/* Superadmin-only tabs */}
        {isSuperadmin && (
          <>
            <button onClick={() => setActiveTab('connections')} style={tabStyle('connections')}>
              🔗 Connections
            </button>
            <button onClick={() => setActiveTab('viewas')} style={tabStyle('viewas')}>
              👁 View As Author
            </button>
            <button onClick={() => setActiveTab('danger')} style={{
              ...tabStyle('danger'),
              color: activeTab === 'danger' ? '#ef4444' : 'rgba(239,68,68,0.6)',
              borderBottom: activeTab === 'danger' ? '2px solid #ef4444' : '2px solid transparent',
            }}>
              ⚠ Danger Zone
            </button>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB: Performance Overview
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div>
          {analyticsLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Calculating global metrics...</div>
          ) : !analytics ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444', background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
              Backend aggregation engine offline. Please install the `get_system_analytics` RPC in Supabase.
            </div>
          ) : (
            <>
              {/* Institutional KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Faculty Profiled</p>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{analytics.kpis.total_authors}</div>
                </div>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Publications</p>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1 }}>{analytics.kpis.total_publications}</div>
                </div>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Scholar Citations (Net)</p>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10b981', lineHeight: 1 }}>{analytics.kpis.total_citations}</div>
                </div>
              </div>

              {/* Scopus Disclaimer */}
              <div style={{ background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.15)', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>⚠️</span>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                  <strong style={{ color: '#fb923c' }}>Scopus Data Limitation:</strong> Due to restrictions imposed by the Scopus website, a maximum of 10 Scopus-indexed publications can be fetched per faculty profile. Paper URLs, individual citation counts, and other granular metadata from Scopus cannot be programmatically extracted. Institutional Scopus metrics may be incomplete.
                </p>
              </div>

              {/* Institutional Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '1.5rem', fontWeight: 600 }}>Publication Distribution by Platform</h3>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={analytics.platform_distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                          {analytics.platform_distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)', fontSize: '0.8rem' }} itemStyle={{ color: 'var(--color-text)' }} />
                        <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '1.5rem', fontWeight: 600 }}>Decade Velocity (Output/Year)</h3>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart data={analytics.yearly_velocity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="year" stroke="var(--color-border)" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--color-border)" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)', fontSize: '0.8rem' }} />
                        <Line type="monotone" dataKey="papers" name="Papers Published" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Advanced Institutional Analytics */}
              {advancedAnalyticsLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Aggregating deeper institutional metrics...</div>
              ) : (
                <>
                  {(() => {
                    const totalScholarCites = globalAuthors.reduce((acc, a) => acc + (a.scholar_citations || 0), 0)
                    const totalScopusCites  = globalAuthors.reduce((acc, a) => acc + (a.scopus_citations || 0), 0)
                    const totalWosCites     = globalAuthors.reduce((acc, a) => acc + (a.wos_citations || 0), 0)
                    const topFaculty = [...globalAuthors].sort((a,b) => ((b.scholar_citations||0)+(b.scopus_citations||0)+(b.wos_citations||0)) - ((a.scholar_citations||0)+(a.scopus_citations||0)+(a.wos_citations||0))).slice(0, 5)
                    const topGlobalPapers = [...globalPubs].sort((a,b) => ((b.scholar_citations||0)+(b.scopus_citations||0)+(b.wos_citations||0)) - ((a.scholar_citations||0)+(a.scopus_citations||0)+(a.wos_citations||0))).slice(0, 5)
                    return (
                      <>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1rem', letterSpacing: '-0.02em', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>Global Citation Matrix</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                          {[
                            { label: 'Google Scholar', color: '#3b82f6', cites: totalScholarCites, outputs: globalPubs.filter(p => p.in_scholar).length },
                            { label: 'Scopus',         color: '#f97316', cites: totalScopusCites,  outputs: globalPubs.filter(p => p.in_scopus).length },
                            { label: 'Web of Science', color: '#a855f7', cites: totalWosCites,     outputs: globalPubs.filter(p => p.in_wos).length },
                          ].map(({ label, color, cites, outputs }) => (
                            <div key={label} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem', borderTop: `4px solid ${color}` }}>
                              <h3 style={{ fontSize: '1rem', color: 'var(--color-text)', fontWeight: 600, marginBottom: '1.2rem' }}>{label}</h3>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Net Institutional Citations</span>
                                <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{cites.toLocaleString()}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Indexed Outputs</span>
                                <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{outputs.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.5rem', fontWeight: 600 }}>Elite Faculty Leaderboard</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Ranked by net aggregated citations across all three indexes.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                              {topFaculty.length > 0 ? topFaculty.map((author, idx) => {
                                const netCites = (author.scholar_citations||0)+(author.scopus_citations||0)+(author.wos_citations||0)
                                return (
                                  <div key={author.id||idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-accent-muted)', padding: '0.8rem', borderRadius: 8 }}>
                                    <div>
                                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginRight: '0.8rem', fontWeight: 700 }}>#{idx+1}</span>
                                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 600 }}>{author.canonical_name}</span>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>({author.department})</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: 12, fontWeight: 700 }}>{netCites.toLocaleString()} Cites</span>
                                  </div>
                                )
                              }) : <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No ranked faculty found.</div>}
                            </div>
                          </div>

                          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.5rem', fontWeight: 600 }}>Global Highest Impact Research</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>The most globally cited publications across the entire institution.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                              {topGlobalPapers.length > 0 ? topGlobalPapers.map((paper, idx) => {
                                const net = (paper.scholar_citations||0)+(paper.scopus_citations||0)+(paper.wos_citations||0)
                                return (
                                  <div key={paper.id||idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-accent-muted)', padding: '0.8rem', borderRadius: 8, gap: '1rem' }}>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginRight: '0.5rem', fontWeight: 700 }}>#{idx+1}</span>
                                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 500 }} title={paper.title}>{paper.title}</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, flexShrink: 0 }}>{net.toLocaleString()} Cites</span>
                                  </div>
                                )
                              }) : <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No publications available.</div>}
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: Identity Claims
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'claims' && (
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-header-bg)' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 600 }}>Pending Verifications</h3>
          </div>
          {claimsLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading records...</div>
          ) : claims.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>All identity claims have been resolved.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(28, 28, 34, 0.95)', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Type</th>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Applicant Email</th>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Claimed Identity</th>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Department</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right', borderBottom: '1px solid var(--color-border)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(claims || []).map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {c.status === 'detach_pending' ? (
                        <span style={{ background: 'rgba(249,115,22,0.1)', color: '#fb923c', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>DETACH</span>
                      ) : (
                        <span style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>LINK</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>{c.profiles?.email}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>{c.master_authors?.canonical_name || '—'}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{c.master_authors?.department || '—'}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      {c.status === 'detach_pending' ? (
                        <button onClick={() => handleApproveDetach(c.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.35rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Approve Detach</button>
                      ) : (
                        <>
                          <button onClick={() => handleApprove(c.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.35rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                          <button onClick={() => handleReject(c.id)} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '0.35rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: Connections (Superadmin only)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'connections' && isSuperadmin && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.3rem' }}>Active Account ↔ Author Connections</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>All faculty accounts with a verified, linked author identity.</p>
          </div>

          {connectionsLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading connections...</div>
          ) : connections.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
              No active account-author connections found.
            </div>
          ) : (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-header-bg)', color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Account Email</th>
                    <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Linked Author</th>
                    <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Department</th>
                    <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Platforms</th>
                    <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((conn) => (
                    <tr key={conn.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-muted)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 500 }}>{conn.email}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                        {conn.master_authors?.canonical_name || '—'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {conn.master_authors?.department || '—'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {conn.master_authors?.scholar_id && <span style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>GS</span>}
                          {conn.master_authors?.scopus_id  && <span style={{ background: 'rgba(249,115,22,0.1)', color: '#fb923c', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>Scopus</span>}
                          {conn.master_authors?.wos_id     && <span style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>WoS</span>}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {new Date(conn.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {connections.length} active connection{connections.length !== 1 ? 's' : ''} found
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: View As Author (Superadmin only)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'viewas' && isSuperadmin && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.3rem' }}>View Faculty Dashboards</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Select any faculty from the master database to preview their research analytics dashboard.</p>
          </div>

          {advancedAnalyticsLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading faculty list...</div>
          ) : globalAuthors.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
              No faculty records found in database.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {globalAuthors.map((author) => (
                <div key={author.id} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,92,246,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.2rem' }}>
                      {author.canonical_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {author.department || 'Unknown Department'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {author.scholar_id && <span style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>GS</span>}
                    {author.scopus_id  && <span style={{ background: 'rgba(249,115,22,0.1)', color: '#fb923c', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>Scopus</span>}
                    {author.wos_id     && <span style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>WoS</span>}
                  </div>
                  <button
                    onClick={() => setImpersonatedProfile({ email: 'Impersonating: ' + author.canonical_name, role: 'faculty', linked_author_id: author.id, master_authors: author })}
                    style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    👁 View Dashboard
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── View-as-Author Overlay Modal ── */}
          {impersonatedProfile && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000,
              display: 'flex', flexDirection: 'column', backdropFilter: 'blur(4px)',
              animation: 'fadeIn 0.2s ease'
            }}>
              {/* Modal top bar */}
              <div style={{
                height: 52, background: 'var(--color-header-bg)', borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 1.5rem', flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700 }}>
                    👁 VIEWING AS AUTHOR
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {impersonatedProfile.master_authors?.canonical_name || impersonatedProfile.email}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    — Read-only preview
                  </span>
                </div>
                <button
                  onClick={() => setImpersonatedProfile(null)}
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '0.35rem 1rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                >
                  ✕ Close Preview
                </button>
              </div>
              {/* Scrollable dashboard content */}
              <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg)' }}>
                <FacultyDashboard profile={impersonatedProfile} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: Danger Zone (Superadmin only)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'danger' && isSuperadmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap:'0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize:'1.1rem', flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: '#f87171' }}>Danger Zone — Destructive Operations.</strong> These actions are irreversible. Data deleted here cannot be recovered unless you have a database backup. Proceed only if you are certain.
            </p>
          </div>

          {/* ── Clear Master Publications ── */}
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.4rem' }}>Clear Master Publications</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Deletes all records in the <code style={{ background: 'var(--color-bg)', padding: '0.1rem 0.3rem', borderRadius: 4, fontSize: '0.75rem' }}>master_publications</code> table. Faculty author profiles and user accounts remain intact.
                </p>
              </div>
              <button
                onClick={handleClearMaster}
                disabled={clearMasterLoading}
                style={{ background: 'rgba(249,115,22,0.1)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)', padding: '0.5rem 1.25rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: clearMasterLoading ? 'wait' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s' }}
                onMouseEnter={e => { if(!clearMasterLoading) e.currentTarget.style.background = 'rgba(249,115,22,0.2)' }}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.1)'}
              >
                {clearMasterLoading ? 'Clearing...' : '🗑 Clear Master'}
              </button>
            </div>
          </div>

          {/* ── Clear Research Data (Full) ── */}
          <div style={{ background: 'var(--color-card)', border: '2px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', marginBottom: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#f87171', marginBottom: '0.4rem' }}>Clear All Research Data</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Permanently deletes all records in <code style={{ background: 'var(--color-bg)', padding: '0.1rem 0.3rem', borderRadius: 4, fontSize: '0.75rem' }}>master_authors</code> AND <code style={{ background: 'var(--color-bg)', padding: '0.1rem 0.3rem', borderRadius: 4, fontSize: '0.75rem' }}>master_publications</code>, and resets all faculty account links. User credentials and profile details are kept intact.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder='Type "I understand" to enable'
                value={clearDbConfirmText}
                onChange={e => setClearDbConfirmText(e.target.value)}
                style={{ flex: 1, background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.85rem', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#ef4444'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
              <button
                onClick={handleClearDb}
                disabled={clearDbLoading || clearDbConfirmText.trim().toLowerCase() !== 'i understand'}
                style={{
                  background: clearDbConfirmText.trim().toLowerCase() === 'i understand' ? '#ef4444' : 'rgba(239,68,68,0.1)',
                  color: clearDbConfirmText.trim().toLowerCase() === 'i understand' ? '#fff' : 'rgba(239,68,68,0.4)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: '0.6rem 1.25rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
                  cursor: (clearDbLoading || clearDbConfirmText.trim().toLowerCase() !== 'i understand') ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap', transition: 'all 0.3s'
                }}
              >
                {clearDbLoading ? 'Clearing...' : '☢ Clear All Research'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => !isExporting && setIsExportModalOpen(false)}
        title="Institutional Master Records Export"
        isLoading={isExporting}
        onExport={handleGlobalExport}
      />
    </div>
  )
}
