import { useState, useEffect, useCallback } from 'react'
import { BACKEND_URL } from '../constants'

/**
 * Polls the backend health endpoint and returns:
 * 'connecting' | 'active' | 'offline'
 */
export function useHeartbeat(pollInterval = 30000) {
  const [status, setStatus] = useState('connecting')

  const ping = useCallback(async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch(`${BACKEND_URL}/`, { signal: controller.signal })
      setStatus(res.ok ? 'active' : 'offline')
    } catch {
      setStatus('offline')
    } finally {
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    ping()
    const id = setInterval(ping, pollInterval)
    return () => clearInterval(id)
  }, [ping, pollInterval])

  return status
}
