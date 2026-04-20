import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const SECTION_FIELDS = [
  {
    section: 'Professional Identity',
    icon: '🏛',
    fields: [
      { key: 'designation', label: 'Designation / Position', placeholder: 'e.g. Associate Professor', type: 'text' },
      { key: 'office_location', label: 'Office / Room No.', placeholder: 'e.g. Room 412, Block B' , type: 'text' },
      { key: 'phone', label: 'Contact Number', placeholder: 'e.g. +91 9876543210', type: 'text' },
    ]
  },
  {
    section: 'Academic Background',
    icon: '🎓',
    fields: [
      { key: 'area_of_specialization', label: 'Area of Specialization', placeholder: 'e.g. Machine Learning, Computer Vision, NLP', type: 'text' },
      { key: 'education', label: 'Education / Degrees', placeholder: 'e.g.\nPh.D. in Computer Science — IIT Hyderabad (2018)\nM.Tech in CSE — JNTUH (2013)', type: 'textarea' },
      { key: 'teaching_subjects', label: 'Teaching Subjects', placeholder: 'e.g. Data Structures, DBMS, Machine Learning', type: 'textarea' },
    ]
  },
  {
    section: 'Recognition & Activities',
    icon: '🏆',
    fields: [
      { key: 'awards', label: 'Awards & Recognitions', placeholder: 'e.g.\nBest Paper Award — IEEE ICAI 2022\nExcellent Teacher Award — VNR VJIET 2021', type: 'textarea' },
    ]
  },
  {
    section: 'External Presence',
    icon: '🔗',
    fields: [
      { key: 'linkedin_url', label: 'LinkedIn Profile URL', placeholder: 'https://linkedin.com/in/your-profile', type: 'text' },
      { key: 'personal_website', label: 'Personal Website / Google Site', placeholder: 'https://sites.google.com/view/your-name', type: 'text' },
    ]
  }
]

export default function FacultyProfilePage({ profile, session }) {
  const navigate = useNavigate()
  const [authorData, setAuthorData] = useState(null)
  const [details, setDetails] = useState({})
  const [originalDetails, setOriginalDetails] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  
  const [activeClaim, setActiveClaim] = useState(null)
  const [detachLoading, setDetachLoading] = useState(false)

  useEffect(() => {
    fetchProfileData()
  }, [profile])

  async function fetchProfileData() {
    if (!profile?.id) return
    setLoading(true)

    // Fetch master_authors data (research identity)
    const authorPromise = profile.linked_author_id
      ? supabase.from('master_authors').select('*').eq('id', profile.linked_author_id).single()
      : Promise.resolve({ data: null })

    // Fetch or initialize faculty_details
    const detailsPromise = supabase
      .from('faculty_details')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle()
      
    const claimPromise = supabase
      .from('profile_claims')
      .select('*')
      .eq('profile_id', profile.id)
      .in('status', ['approved', 'detach_pending'])
      .maybeSingle()

    const [authorRes, detailsRes, claimRes] = await Promise.all([authorPromise, detailsPromise, claimPromise])

    if (authorRes.data) setAuthorData(authorRes.data)
    if (claimRes.data) setActiveClaim(claimRes.data)

    const d = detailsRes.data || {}
    setDetails(d)
    setOriginalDetails(d)

    setLoading(false)
  }

  function handleChange(key, value) {
    setDetails(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)

    const payload = {
      profile_id: profile.id,
      linked_author_id: profile.linked_author_id || null,
      designation: details.designation || null,
      phone: details.phone || null,
      office_location: details.office_location || null,
      area_of_specialization: details.area_of_specialization || null,
      education: details.education || null,
      awards: details.awards || null,
      teaching_subjects: details.teaching_subjects || null,
      linkedin_url: details.linkedin_url || null,
      personal_website: details.personal_website || null,
    }

    // Upsert on profile_id (unique constraint)
    const { error } = await supabase
      .from('faculty_details')
      .upsert(payload, { onConflict: 'profile_id' })

    if (error) {
      setSaveMsg({ type: 'error', text: error.message })
    } else {
      setOriginalDetails(details)
      setIsEditing(false)
      setSaveMsg({ type: 'success', text: 'Profile details saved successfully!' })
      setTimeout(() => setSaveMsg(null), 3000)
    }
    setSaving(false)
  }

  function handleCancel() {
    setDetails(originalDetails)
    setIsEditing(false)
    setSaveMsg(null)
  }

  async function handleRequestDetach() {
    if (!activeClaim) return
    if (!confirm("Are you sure you want to request to detach from this author identity? An admin must approve this. You will lose access to the analytics dashboard until you claim a new identity.")) return
    
    setDetachLoading(true)
    const { error } = await supabase
      .from('profile_claims')
      .update({ status: 'detach_pending' })
      .eq('id', activeClaim.id)
      
    if (error) {
      alert("Error requesting detachment: " + error.message)
    } else {
      setActiveClaim(prev => ({ ...prev, status: 'detach_pending' }))
      setSaveMsg({ type: 'success', text: 'Detachment request sent to administrators.' })
    }
    setDetachLoading(false)
  }

  if (loading) {
    return (
      <div className="slide-up" style={{ padding: '4rem 2rem', maxWidth: 900, margin: '0 auto' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 120, background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', marginBottom: '1.5rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:0.85} }`}</style>
      </div>
    )
  }

  const displayName = authorData?.canonical_name || session?.user?.user_metadata?.full_name || profile?.email
  const avatarUrl = session?.user?.user_metadata?.avatar_url

  return (
    <div className="slide-up" style={{ padding: '3rem 2rem', maxWidth: 900, margin: '0 auto' }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>
              {displayName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.15rem', letterSpacing: '-0.02em' }}>
              {displayName}
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
              {details.designation || authorData?.department || 'Faculty Profile'}
              {authorData?.department && details.designation && ` — ${authorData.department}`}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0', opacity: 0.7 }}>{profile.email}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', padding: '0.55rem 1.25rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              ✏ Edit Profile
            </button>
          ) : (
            <>
              <button onClick={handleCancel} style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '0.55rem 1rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.55rem 1.25rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s' }}
              >
                {saving ? 'Saving...' : '✓ Save Changes'}
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '0.55rem 1rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            ← Analytics
          </button>
        </div>
      </div>

      {/* ── Save message toast ── */}
      {saveMsg && (
        <div style={{
          marginBottom: '1.5rem', padding: '0.75rem 1rem', borderRadius: 10,
          background: saveMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${saveMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: saveMsg.type === 'success' ? '#10b981' : '#ef4444',
          fontSize: '0.85rem', fontWeight: 500
        }}>
          {saveMsg.text}
        </div>
      )}

      {/* ── Research Identity Banner (read-only from master_authors) ── */}
      {authorData && (
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Research Identity — Synced from Database</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Organization', value: authorData.organization },
              { label: 'Department', value: authorData.department },
              { label: 'Scholar H-Index', value: authorData.scholar_h_index != null ? authorData.scholar_h_index : '—' },
              { label: 'Scholar Citations', value: authorData.scholar_citations != null ? authorData.scholar_citations?.toLocaleString() : '—' },
              { label: 'Scopus ID', value: authorData.scopus_id || '—' },
              { label: 'ORCID', value: authorData.orcid || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem', fontWeight: 600 }}>{label}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 500, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '1rem', opacity: 0.65 }}>
            ⚙ This section is automatically populated from the scraper data and cannot be edited here.
          </p>
          
          {/* DETACHMENT LOGIC */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Incorrect identity linked?</span>
            {activeClaim?.status === 'detach_pending' ? (
              <span style={{ fontSize: '0.8rem', color: '#fb923c', fontWeight: 600, background: 'rgba(249,115,22,0.1)', padding: '0.3rem 0.6rem', borderRadius: 6 }}>
                ⏳ Detachment Request Pending
              </span>
            ) : (
              <button 
                onClick={handleRequestDetach}
                disabled={detachLoading}
                style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.45rem 1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: detachLoading ? 'wait' : 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                {detachLoading ? 'Requesting...' : 'Request Detachment'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Platform Links ── */}
      {authorData && (
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {authorData.scholar_id && (
            <a href={`https://scholar.google.com/citations?user=${authorData.scholar_id}`} target="_blank" rel="noopener noreferrer"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
            >↗ Google Scholar</a>
          )}
          {details.linkedin_url && (
            <a href={details.linkedin_url} target="_blank" rel="noopener noreferrer"
              style={{ background: 'rgba(10,102,194,0.1)', color: '#6ab0f5', border: '1px solid rgba(10,102,194,0.2)', padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none' }}
            >↗ LinkedIn</a>
          )}
          {details.personal_website && (
            <a href={details.personal_website} target="_blank" rel="noopener noreferrer"
              style={{ background: 'rgba(139,92,246,0.1)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.2)', padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none' }}
            >↗ Website</a>
          )}
        </div>
      )}

      {/* ── Editable Detail Sections ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {SECTION_FIELDS.map(({ section, icon, fields }) => (
          <div key={section} style={{ background: 'var(--color-card)', border: `1px solid ${isEditing ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.3s' }}>
            {/* Section Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-header-bg)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1rem' }}>{icon}</span>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{section}</h3>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {fields.map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {label}
                  </label>
                  {isEditing ? (
                    type === 'textarea' ? (
                      <textarea
                        value={details[key] || ''}
                        onChange={e => handleChange(key, e.target.value)}
                        placeholder={placeholder}
                        rows={4}
                        style={{
                          width: '100%', background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                          color: 'var(--color-text)', padding: '0.65rem 0.9rem', borderRadius: 8,
                          fontSize: '0.875rem', outline: 'none', resize: 'vertical', lineHeight: 1.6,
                          fontFamily: 'inherit', transition: 'border-color 0.2s', boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                      />
                    ) : (
                      <input
                        type="text"
                        value={details[key] || ''}
                        onChange={e => handleChange(key, e.target.value)}
                        placeholder={placeholder}
                        style={{
                          width: '100%', background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                          color: 'var(--color-text)', padding: '0.65rem 0.9rem', borderRadius: 8,
                          fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                      />
                    )
                  ) : (
                    <div style={{ fontSize: '0.9rem', color: details[key] ? 'var(--color-text)' : 'var(--color-text-muted)', lineHeight: 1.65, whiteSpace: 'pre-wrap', minHeight: 24, fontStyle: details[key] ? 'normal' : 'italic', opacity: details[key] ? 1 : 0.6 }}>
                      {details[key] || `Not set — click "Edit Profile" to add`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom save bar (sticky when editing) */}
      {isEditing && (
        <div style={{
          position: 'sticky', bottom: '1.5rem', marginTop: '1.5rem',
          background: 'var(--color-card)', border: '1px solid var(--color-accent)',
          borderRadius: 12, padding: '1rem 1.5rem',
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem',
          boxShadow: '0 8px 32px rgba(139,92,246,0.2)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', flex: 1 }}>You have unsaved changes.</span>
          <button onClick={handleCancel} style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '✓ Save Changes'}
          </button>
        </div>
      )}
    </div>
  )
}
