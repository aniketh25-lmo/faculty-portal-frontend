import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import ExportModal from './ExportModal'
import { generateExcelReport } from '../utils/excel'

const COLORS = ['#3b82f6', '#f97316', '#a855f7'] // Scholar, Scopus, WoS

export default function AdminDashboard({ profile }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'analytics'

  const setActiveTab = (tabValue) => {
    setSearchParams({ tab: tabValue })
  }
  
  const [claims, setClaims] = useState([])
  const [claimsLoading, setClaimsLoading] = useState(true)

  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchClaims()
    fetchSystemAnalytics()
  }, [])

  async function fetchClaims() {
    setClaimsLoading(true)
    const { data } = await supabase
      .from('profile_claims')
      .select(`
        id, created_at, status,
        profiles ( email ),
        master_authors ( canonical_name, department )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    setClaims(data || [])
    setClaimsLoading(false)
  }

  async function fetchSystemAnalytics() {
    setAnalyticsLoading(true)
    const { data, error } = await supabase.rpc('get_system_analytics')
    if (!error && data) {
      setAnalytics(data)
    }
    setAnalyticsLoading(false)
  }

  async function handleApprove(claimId) {
    if (!confirm('Approve this claim? This will grant the user access to this profile.')) return
    
    const { error } = await supabase.rpc('approve_claim', { target_claim_id: claimId })
    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      setClaims(c => c.filter(x => x.id !== claimId))
    }
  }

  async function handleReject(claimId) {
    if (!confirm('Reject this claim?')) return
    
    const { error } = await supabase.rpc('reject_claim', { target_claim_id: claimId })
    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      setClaims(c => c.filter(x => x.id !== claimId))
    }
  }

  async function handleGlobalExport(filters) {
    setIsExporting(true)
    try {
      // Fetch ALL publications and ALL faculty profiles in parallel
      const [pubRes, authorRes] = await Promise.all([
        supabase.from('master_publications').select('*'),
        supabase.from('master_authors').select('*')
      ])
      if (pubRes.error) throw pubRes.error
      if (authorRes.error) throw authorRes.error

      generateExcelReport(
        "VNR VJIET — CSE Institutional Report",
        authorRes.data || [],
        pubRes.data || [],
        filters
      )

      setIsExportModalOpen(false)
    } catch (err) {
      alert("Failed to export database: " + err.message)
    } finally {
      setIsExporting(false)
    }
  }

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
            Superadmin Mode
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2.5rem' }}>
        <button 
          onClick={() => setActiveTab('analytics')}
          style={{ 
            background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            color: activeTab === 'analytics' ? 'var(--color-text)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'analytics' ? '2px solid var(--color-accent)' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Performance Overview
        </button>
        <button 
          onClick={() => setActiveTab('claims')}
          style={{ 
            background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            color: activeTab === 'claims' ? 'var(--color-text)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'claims' ? '2px solid var(--color-accent)' : '2px solid transparent',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          Identity Claims
          {claims.length > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 20 }}>{claims.length}</span>
          )}
        </button>
      </div>

      {/* ── Analytics Tab ── */}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                
                {/* Platform Distribution Pie Chart */}
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '1.5rem', fontWeight: 600 }}>Publication Distribution by Platform</h3>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={analytics.platform_distribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {analytics.platform_distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: '#1c1c22', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: '0.8rem' }} 
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Macro Velocity Chart */}
                <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '1.5rem', fontWeight: 600 }}>Decade Velocity (Output/Year)</h3>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart data={analytics.yearly_velocity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="year" stroke="#ffffff40" tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#ffffff40" tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: '#1c1c22', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: '0.8rem' }} 
                        />
                        <Line type="monotone" dataKey="papers" name="Papers Published" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      )}

      {/* ── Claims Tab ── */}
      {activeTab === 'claims' && (
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-header-bg)' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 600 }}>Pending Verifications</h3>
          </div>
          
          {claimsLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading records...</div>
          ) : claims.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              All identity claims have been resolved.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(28, 28, 34, 0.95)', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Applicant Email</th>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Claimed Identity</th>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>Department</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right', borderBottom: '1px solid var(--color-border)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(claims || []).map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                      {c.profiles?.email}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                      {c.master_authors?.canonical_name}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {c.master_authors?.department}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleApprove(c.id)}
                        style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.35rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >Approve</button>
                      <button 
                        onClick={() => handleReject(c.id)}
                        style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '0.35rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
