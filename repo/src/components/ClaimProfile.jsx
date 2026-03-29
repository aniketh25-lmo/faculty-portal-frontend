import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ClaimProfile({ session }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  
  const [existingClaim, setExistingClaim] = useState(null)
  const [loadingClaim, setLoadingClaim] = useState(true)

  // 1. Check if the user already has a pending claim
  useEffect(() => {
    async function checkClaim() {
      if (!session) return
      setLoadingClaim(true)
      const { data, error } = await supabase
        .from('profile_claims')
        .select(`*, master_authors(canonical_name, department)`)
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (data) setExistingClaim(data)
      setLoadingClaim(false)
    }
    checkClaim()
  }, [session])

  // 2. Search logic
  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    // Using the custom PostgreSQL RPC function to do a deep fuzzy search across all 4 tables!
    const { data, error } = await supabase
      .rpc('search_faculty_profiles', { search_term: query.trim() })
      .limit(10)
    
    if (error) {
      console.error(error)
      setResults([])
    } else {
      setResults(data || [])
    }
    setSearching(false)
  }

  // 3. Submit Claim Route
  async function submitClaim(authorId) {
    if (!confirm('Are you sure you want to claim this profile? Admin approval is required.')) return

    const { data, error } = await supabase
      .from('profile_claims')
      .insert({ profile_id: session.user.id, master_author_id: authorId })
      .select('*, master_authors(canonical_name, department)')
      .single()

    if (error) {
      alert(`Error submitting claim: ${error.message}`)
    } else {
      setExistingClaim(data)
    }
  }

  if (loadingClaim) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text)' }}>Checking profile status...</div>

  // If they already submitted a claim, trap them here until an Admin approves it.
  if (existingClaim && existingClaim.status === 'pending') {
    return (
      <div style={{ padding: '4rem 2rem', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--color-text)', marginBottom: '0.5rem' }}>Profile Claim Pending</h2>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            You have requested to link your account to <strong>{existingClaim.master_authors?.canonical_name}</strong> from the <em>{existingClaim.master_authors?.department}</em> department.
          </p>
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 8, color: '#f59e0b', fontSize: '0.9rem' }}>
            An Administrator must approve this claim before you can access your dashboard.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text)', marginBottom: '0.5rem' }}>Claim Your Profile</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
        Welcome {session.user.email}! To view your personal dashboards and metrics, search for your name in the master records below to link your account.
      </p>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <input 
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Enter your name (e.g. Vadlana)..."
          style={{
            flex: 1, padding: '0.85rem 1rem', borderRadius: 10,
            background: 'var(--color-header-bg)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', fontSize: '0.95rem',
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        />
        <button 
          type="submit" 
          disabled={searching || !query}
          style={{
            padding: '0 1.5rem', borderRadius: 10,
            background: 'var(--color-accent)', color: '#fff', border: 'none',
            fontWeight: 600, cursor: (searching || !query) ? 'not-allowed' : 'pointer',
            opacity: (searching || !query) ? 0.7 : 1, transition: 'filter 0.2s'
          }}
          onMouseEnter={e => { if(!searching && query) e.currentTarget.style.filter = 'brightness(1.15)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
        >
          {searching ? '🔍...' : 'Search'}
        </button>
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map(author => (
            <div key={author.id} style={{
              background: 'var(--color-card)', border: '1px solid var(--color-border)',
              borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>{author.canonical_name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{author.department}</p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span title="Scopus H-Index">Scopus H: <strong>{author.scopus_h_index || 0}</strong></span>
                  <span title="Scholar H-Index">Scholar H: <strong>{author.scholar_h_index || 0}</strong></span>
                </div>
              </div>
              <button 
                onClick={() => submitClaim(author.id)}
                style={{
                  padding: '0.6rem 1rem', borderRadius: 8,
                  background: 'transparent', color: '#10b981', border: '1px solid #10b981',
                  fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#10b981' }}
              >
                Claim Profile
              </button>
            </div>
          ))}
        </div>
      )}
      {results.length === 0 && query && !searching && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No records found matching "{query}".</p>
      )}
    </div>
  )
}
