'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const SESSION_KEY = 'sirius_access_session_id'

// Called once when the dashboard mounts (user is authenticated)
async function openSession() {
  const existing = sessionStorage.getItem(SESSION_KEY)
  if (existing) return // already open in this browser tab session

  try {
    const res = await fetch('/api/access/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login' }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.sessionId) sessionStorage.setItem(SESSION_KEY, data.sessionId)
    }
  } catch {
    // fire-and-forget, never block the UI
  }
}

async function closeSession() {
  const sessionId = sessionStorage.getItem(SESSION_KEY)
  if (!sessionId) return
  sessionStorage.removeItem(SESSION_KEY)
  try {
    await fetch('/api/access/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout', sessionId }),
    })
  } catch {
    // fire-and-forget
  }
}

async function trackPage(path: string) {
  try {
    await fetch('/api/access/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, pageTitle: document.title }),
    })
  } catch {
    // fire-and-forget
  }
}

export function AccessTracker() {
  const pathname = usePathname()
  const initialized = useRef(false)

  // Open session once on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    openSession()

    // Close session gracefully on tab close / unload
    const handleUnload = () => {
      const sessionId = sessionStorage.getItem(SESSION_KEY)
      if (!sessionId) return
      sessionStorage.removeItem(SESSION_KEY)
      // Use sendBeacon for reliability on unload
      navigator.sendBeacon(
        '/api/access/session',
        new Blob(
          [JSON.stringify({ action: 'logout', sessionId })],
          { type: 'application/json' }
        )
      )
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  // Track every route change
  useEffect(() => {
    if (!pathname) return
    // Skip admin routes — we only care about app usage
    if (pathname.startsWith('/admin')) return
    trackPage(pathname)
  }, [pathname])

  return null
}
