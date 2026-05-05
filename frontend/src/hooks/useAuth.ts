/**
 * Enhanced useAuth hook with token management and auto-refresh
 */

import { useContext, useEffect } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { auth } from '../services/firebase'

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  // Sync Firebase ID token to localStorage
  useEffect(() => {
    const syncToken = async () => {
      const user = auth.currentUser
      if (user) {
        try {
          const token = await user.getIdToken()
          localStorage.setItem('authToken', token)
        } catch (error) {
          console.error('Failed to get ID token:', error)
          localStorage.removeItem('authToken')
        }
      } else {
        localStorage.removeItem('authToken')
      }
    }

    // Sync token immediately
    syncToken()

    // Sync token every 50 minutes (tokens expire after 1 hour)
    const interval = setInterval(syncToken, 50 * 60 * 1000)

    return () => clearInterval(interval)
  }, [context.currentUser])

  return context
}

/**
 * Get current Firebase ID token
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null

  try {
    const token = await user.getIdToken()
    localStorage.setItem('authToken', token)
    return token
  } catch (error) {
    console.error('Failed to get ID token:', error)
    return null
  }
}

/**
 * Force refresh Firebase ID token
 */
export async function refreshIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null

  try {
    const token = await user.getIdToken(true) // Force refresh
    localStorage.setItem('authToken', token)
    return token
  } catch (error) {
    console.error('Failed to refresh ID token:', error)
    return null
  }
}
