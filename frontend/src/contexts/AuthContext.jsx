import { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const signup = async (email, password, name, college, branch, yearOfAdmission) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    await updateProfile(user, { displayName: name })

    const userProfile = {
      id: user.uid,
      firebase_uid: user.uid,  // Add firebase_uid field for backend compatibility
      name,
      email,
      college,
      branch,
      year_of_admission: yearOfAdmission,
      trust_score: 0,
      rating: 0.0,
      review_count: 0,
      member_since: new Date().getFullYear().toString(),
      avatar: null,
      email_verified: false,
      dark_mode: false,
      created_at: new Date().toISOString()
    }

    await setDoc(doc(db, 'users', user.uid), userProfile)
    return userCredential
  }

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  }

  const logout = async () => {
    await signOut(auth)
    setUserProfile(null)
  }

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email)
  }

  const fetchUserProfile = async (userId) => {
    const docRef = doc(db, 'users', userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const profile = { id: docSnap.id, ...docSnap.data() }
      setUserProfile(profile)
      return profile
    }
    return null
  }

  const refreshUserProfile = async () => {
    if (currentUser) {
      return await fetchUserProfile(currentUser.uid)
    }
    return null
  }

  const syncEmailVerificationStatus = async (user) => {
    if (!user) return

    try {
      // Reload user to get latest emailVerified status
      await user.reload()
      
      const docRef = doc(db, 'users', user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const currentData = docSnap.data()
        
        // Only update if verification status changed
        if (currentData.email_verified !== user.emailVerified) {
          await updateDoc(docRef, {
            email_verified: user.emailVerified
          })
          
          // Update local state
          setUserProfile(prev => prev ? { ...prev, email_verified: user.emailVerified } : null)
        }
      }
    } catch (error) {
      console.error('Error syncing email verification status:', error)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        await fetchUserProfile(user.uid)
        await syncEmailVerificationStatus(user)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const getIdToken = async () => {
    if (currentUser) {
      return await currentUser.getIdToken()
    }
    return null
  }

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    resetPassword,
    fetchUserProfile,
    refreshUserProfile,
    syncEmailVerificationStatus,
    getIdToken,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
