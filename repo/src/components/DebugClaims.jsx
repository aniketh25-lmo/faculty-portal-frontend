import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function DebugClaims() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase.from('profile_claims').select('*')
      setData({ claims_in_db: data, error })
    }
    fetch()
  }, [])
  
  return (
    <pre style={{ background: '#222', color: '#0f0', padding: 20, fontSize: 12 }}>
      DEBUG: {JSON.stringify(data, null, 2)}
    </pre>
  )
}
