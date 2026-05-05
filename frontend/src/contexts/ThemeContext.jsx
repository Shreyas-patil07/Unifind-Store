import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

const ThemeContext = createContext({})

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const { currentUser, userProfile } = useAuth()
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load dark mode preference from user profile
  useEffect(() => {
    if (userProfile) {
      setDarkMode(userProfile.dark_mode || false)
    }
    setLoading(false)
  }, [userProfile])

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = async () => {
    if (!currentUser) return

    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)

    try {
      // Update in Firestore
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, {
        dark_mode: newDarkMode
      })
    } catch (error) {
      console.error('Failed to update dark mode preference:', error)
      // Revert on error
      setDarkMode(!newDarkMode)
    }
  }

  const value = {
    darkMode,
    toggleDarkMode,
    loading
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
