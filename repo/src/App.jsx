import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

import SplashScreen from './components/SplashScreen'
import Header from './components/Header'
import HomePage from './components/HomePage'
import InfoModal from './components/InfoModal'
import Login from './components/Login'
import ClaimProfile from './components/ClaimProfile'
import AdminDashboard from './components/AdminDashboard'
import FacultyDashboard from './components/FacultyDashboard'

import { useHeartbeat } from './hooks/useHeartbeat'
import './App.css'

export default function App() {
  const [theme,         setTheme]         = useState('dark')
  const [showSplash,    setShowSplash]    = useState(true)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [session,       setSession]       = useState(null)
  const [profile,       setProfile]       = useState(null)
  
  const dbStatus = useHeartbeat(30000)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Supabase Auth and Profile Listener
  useEffect(() => {
    async function fetchProfile(user) {
      try {
        let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        
        // If profile doesn't exist (PGRST116 is the error code for 0 rows on single()), create it
        if (error && error.code === 'PGRST116') {
          console.log('Profile missing, auto-creating...')
          const res = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            role: 'faculty'
          }).select().single()
          
          if (res.error) throw res.error
          data = res.data
        } else if (error) {
          throw error
        }

        setProfile(data || {})
      } catch (err) {
        console.error('Failed to fetch/create profile', err)
        setProfile({}) // Empty fallback
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header
          theme={theme}
          onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          onInfoClick={() => setShowInfoModal(true)}
          dbStatus={dbStatus}
          session={session}
          profile={profile}
          onLogout={() => supabase.auth.signOut()}
        />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg)' }}>
          <Routes>
            {/* Public Route */}
            <Route path="/" element={<HomePage session={session} profile={profile} />} />
            
            {/* Auth Route */}
            <Route 
              path="/login" 
              element={session ? <Navigate to="/dashboard" /> : <Login />} 
            />

            {/* Protected Route: Faculty Dashboard */}
            <Route 
              path="/dashboard" 
              element={
                !session ? <Navigate to="/login" /> : (
                  profile === null ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>Loading user profile...</div>
                  ) : !profile.linked_author_id ? (
                    profile.role === 'admin' ? <Navigate to="/admin" /> : <ClaimProfile session={session} />
                  ) : (
                    <FacultyDashboard profile={profile} />
                  )
                )
              } 
            />

            {/* Admin Only Route */}
            <Route 
              path="/admin" 
              element={
                !session ? <Navigate to="/login" /> : (
                  profile === null ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>Loading user profile...</div>
                  ) : profile?.role === 'admin' ? (
                    <AdminDashboard profile={profile} />
                  ) : (
                    <Navigate to="/dashboard" />
                  )
                )
              } 
            />
          </Routes>
        </main>
      </div>

      {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
    </>
  )
}
