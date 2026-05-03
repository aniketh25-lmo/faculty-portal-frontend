import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export default function NotificationsMenu({ profile }) {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!profile || !profile.id) return

    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase.channel(`notifications:${profile.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function fetchNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }

  async function markAsRead(id) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', fontSize: '1.2rem',
          width: 34, height: 34, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color 0.2s', position: 'relative'
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
        onMouseLeave={e => e.currentTarget.style.color = isOpen ? 'var(--color-accent)' : 'var(--color-text-muted)'}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#ef4444', color: '#fff',
            fontSize: '0.6rem', fontWeight: 700,
            width: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 320,
          background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)', zIndex: 100,
          animation: 'slide-up 0.2s ease-out', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', maxHeight: 400
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-header-bg)' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 600 }}>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)} style={{
                  padding: '1rem', borderBottom: '1px solid var(--color-border)',
                  background: n.is_read ? 'transparent' : 'var(--color-accent-muted)',
                  cursor: n.is_read ? 'default' : 'pointer',
                  transition: 'background 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ 
                      width: 8, height: 8, borderRadius: '50%', 
                      background: n.type === 'success' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : n.type === 'system' ? '#ef4444' : '#3b82f6'
                    }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>{n.title}</span>
                    {!n.is_read && <span style={{ marginLeft: 'auto', width: 6, height: 6, background: 'var(--color-accent)', borderRadius: '50%' }} />}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{n.message}</p>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', opacity: 0.7 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
