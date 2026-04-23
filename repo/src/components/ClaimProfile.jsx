import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ClaimProfile({ session }) {
  const [query, setQuery] = useState('')
  
  const [existingClaim, setExistingClaim] = useState(null)
  const [loadingClaim, setLoadingClaim] = useState(true)

  const [allProfiles, setAllProfiles] = useState([])
  const [linkedProfileIds, setLinkedProfileIds] = useState([])

  // Load all unlinked profiles
  useEffect(() => {
    async function fetchUnlinked() {
      // 1. Get all linked author IDs from profiles
      const { data: profilesWithLinks } = await supabase
        .from('profiles')
        .select('linked_author_id')
        .not('linked_author_id', 'is', null);
        
      const linkedIds = (profilesWithLinks || []).map(p => p.linked_author_id);
      setLinkedProfileIds(linkedIds);

      // 2. Get all authors
      const { data: allAuthors, error } = await supabase
        .from('master_authors')
        .select('*')
        .order('canonical_name', { ascending: true })
      
      if (!error && allAuthors) {
        setAllProfiles(allAuthors);
      }
    }
    fetchUnlinked()
  }, [])

  // 1. Check if the user already has a pending claim
  useEffect(() => {
    async function checkClaim() {
      if (!session) return
      setLoadingClaim(true)
      const { data, error } = await supabase
        .from('profile_claims')
        .select(`*`)
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (data) {
        const { data: authorData } = await supabase
          .from('master_authors')
          .select('canonical_name, department')
          .eq('id', data.master_author_id)
          .maybeSingle()
          
        setExistingClaim({ ...data, master_authors: authorData })
      }
      setLoadingClaim(false)
    }
    checkClaim()

    // 1b. Listen for real-time status updates from Admin
    const channel = supabase.channel('custom-claim-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profile_claims', filter: `profile_id=eq.${session?.user?.id}` },
        (payload) => {
          // If approved, reload entire app to securely fetch the new profile role and dashboard
          if (payload.new.status === 'approved') {
            window.location.reload()
          } else {
            // If rejected, update the state so they see the rejection instantly
            setExistingClaim(prev => ({ ...prev, ...payload.new }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session])

  // Dynamic Client-side Search logic replacing handleSearch

  // 3. Submit Claim Route
  async function submitClaim(authorId) {
    if (!confirm('Are you sure you want to claim this profile? Admin approval is required.')) return

    // 3a. Security Check: Is this profile already claimed or pending?
    const { data: existingLinkedProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('linked_author_id', authorId)
      .maybeSingle()

    if (existingLinkedProfile) {
      alert("This faculty profile has already been verified and claimed by another user.")
      return
    }

    const { data: existingQueue } = await supabase
      .from('profile_claims')
      .select('id')
      .eq('master_author_id', authorId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingQueue) {
      alert("This profile already has a pending claim request awaiting admin review.")
      return
    }

    // 3b. Submit explicit pending claim
    const { data, error } = await supabase
      .from('profile_claims')
      .insert({ profile_id: session.user.id, master_author_id: authorId, status: 'pending' })
      .select('*')
      .single()

    if (error) {
      if (error.message.includes('profile_claims_profile_id_fkey')) {
        alert("CRITICAL DATABASE ERROR: Your account is missing from the public 'profiles' database table! Supabase is blocking the claim because your Google login lacks a profile record. Please check your Supabase Auth Triggers.")
      } else {
        alert(`Error submitting claim: ${error.message}`)
      }
    } else {
      const match = allProfiles.find(p => p.id === authorId)
      setExistingClaim({ ...data, master_authors: match })
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

      {/* Rejection Banner */}
      {existingClaim && existingClaim.status === 'rejected' && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444',
          padding: '1rem', borderRadius: 8, marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.5
        }}>
          <strong>Claim Rejected:</strong> Your request to link with <em>{existingClaim.master_authors?.canonical_name}</em> was declined by the administrator. Please ensure you are claiming your own profile and try again.
        </div>
      )}

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <input 
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Enter your name (e.g. Vadlana) to filter dynamically..."
          style={{
            width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: 10,
            background: 'var(--color-header-bg)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', fontSize: '0.95rem', boxSizing: 'border-box',
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        />
        <svg 
           xmlns="http://www.w3.org/2000/svg" 
           width="20" height="20" viewBox="0 0 24 24" fill="none" 
           stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
           style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      {/* Results */}
      {(() => {
        let displayList = allProfiles;
        
        if (query.trim()) {
          const lowerQuery = query.trim().toLowerCase();
          const exactStartsWith = [];
          const includes = [];

          allProfiles.forEach(author => {
            const nameLower = author.canonical_name.toLowerCase();
            const deptLower = (author.department || '').toLowerCase();

            if (nameLower.startsWith(lowerQuery)) {
              exactStartsWith.push(author);
            } else if (nameLower.includes(lowerQuery) || deptLower.includes(lowerQuery)) {
              includes.push(author);
            }
          });

          displayList = [...exactStartsWith, ...includes];
        }

        if (displayList.length === 0) {
          return query ? (
             <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No records found matching "{query}".</p>
          ) : null;
        }

        return (
          <>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text)', marginBottom: '1rem' }}>
              {query.trim() ? 'Closest Matches' : 'Master Database Records'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {displayList.map(author => {
                const isClaimed = linkedProfileIds.includes(author.id);
                return (
                <div key={author.id} style={{
                  background: 'var(--color-card)', border: '1px solid var(--color-border)',
                  borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  opacity: isClaimed ? 0.6 : 1
                }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {author.canonical_name}
                  {isClaimed && <span style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 'bold' }}>Claimed</span>}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{author.department}</p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span title="Scopus H-Index">Scopus H: <strong>{author.scopus_h_index || 0}</strong></span>
                  <span title="Scholar H-Index">Scholar H: <strong>{author.scholar_h_index || 0}</strong></span>
                </div>
              </div>
              <button 
                onClick={() => !isClaimed && submitClaim(author.id)}
                disabled={isClaimed}
                style={{
                  padding: '0.6rem 1rem', borderRadius: 8,
                  background: isClaimed ? 'var(--color-header-bg)' : 'transparent', 
                  color: isClaimed ? 'var(--color-text-muted)' : '#10b981', 
                  border: isClaimed ? '1px solid var(--color-border)' : '1px solid #10b981',
                  fontWeight: 600, fontSize: '0.8rem', cursor: isClaimed ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { if(!isClaimed) { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if(!isClaimed) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#10b981'; } }}
              >
                {isClaimed ? 'Already Claimed' : 'Claim Profile'}
              </button>
            </div>
              )})}
            </div>
          </>
        );
      })()}
    </div>
  )
}
