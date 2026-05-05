import axios from 'axios'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from './firebase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Backend API calls
export const createStatusCheck = async (clientName) => {
  const response = await api.post('/status', { client_name: clientName })
  return response.data
}

export const getStatusChecks = async () => {
  const response = await api.get('/status')
  return response.data
}

// Firebase direct calls - Users
export const getUser = async (userId) => {
  const docRef = doc(db, 'users', userId)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() }
  }
  throw new Error('User not found')
}

// Get public user profile via backend API
export const getPublicProfile = async (userId, includePrivate = false) => {
  const response = await api.get(`/users/${userId}/profile`, {
    params: { include_private: includePrivate }
  })
  return response.data
}

// Get total user count
export const getUserCount = async () => {
  try {
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    return snapshot.size
  } catch (error) {
    console.error('Error getting user count:', error)
    return 0
  }
}

export const getUsers = async (limitCount = 100) => {
  const q = query(collection(db, 'users'), limit(limitCount))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Search users by name
export const searchUsers = async (searchQuery) => {
  const response = await api.get(`/users/search/${encodeURIComponent(searchQuery)}`)
  return response.data
}

// Friend management
export const addFriend = async (userId, friendId) => {
  const response = await api.post(`/users/${userId}/friends/${friendId}`)
  return response.data
}

export const acceptFriendRequest = async (userId, friendId) => {
  const response = await api.put(`/users/${userId}/friends/${friendId}/accept`)
  return response.data
}

export const rejectFriendRequest = async (userId, friendId) => {
  const response = await api.put(`/users/${userId}/friends/${friendId}/reject`)
  return response.data
}

export const removeFriend = async (userId, friendId) => {
  const response = await api.delete(`/users/${userId}/friends/${friendId}`)
  return response.data
}

export const getFriends = async (userId) => {
  const response = await api.get(`/users/${userId}/friends`)
  return response.data
}

export const getPendingFriendRequests = async (userId) => {
  const response = await api.get(`/users/${userId}/friends/requests/pending`)
  return response.data
}

export const checkFriendship = async (userId, friendId) => {
  const response = await api.get(`/users/${userId}/friends/check/${friendId}`)
  return response.data
}

// Backend API calls - Products
export const getProduct = async (productId, idToken = null) => {
  const config = {};
  
  // Only add Authorization header if token is provided
  if (idToken) {
    config.headers = { 'Authorization': `Bearer ${idToken}` };
  }
  
  const response = await api.get(`/products/${productId}`, config);
  return response.data;
}

export const getProducts = async (filters = {}) => {
  const params = {}
  
  if (filters.category && filters.category !== 'All') {
    params.category = filters.category
  }
  
  if (filters.seller_id) {
    params.seller_id = filters.seller_id
  }
  
  if (filters.min_price) {
    params.min_price = filters.min_price
  }
  
  if (filters.max_price) {
    params.max_price = filters.max_price
  }
  
  if (filters.condition) {
    params.condition = filters.condition
  }
  
  const response = await api.get('/products', { params })
  // Backend returns paginated response: { items: [], total, page, page_size, pages }
  // Extract the items array for frontend compatibility
  return response.data.items || []
}

export const createProduct = async (productData, idToken) => {
  const response = await api.post('/products', productData, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data
}

export const updateProduct = async (productId, productData, idToken) => {
  const response = await api.patch(`/products/${productId}`, productData, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data
}

export const deleteProduct = async (productId, idToken) => {
  const response = await api.delete(`/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data
}

// Mark product as sold
export const markProductAsSold = async (productId, buyerId, idToken) => {
  const response = await api.patch(`/products/${productId}/mark-sold`,
    { buyer_id: buyerId || null },
    {
      headers: { 'Authorization': `Bearer ${idToken}` }
    }
  )
  return response.data
}

// Mark product as active again
export const markProductAsActive = async (productId, idToken) => {
  const response = await api.patch(`/products/${productId}/mark-active`, {},
    {
      headers: { 'Authorization': `Bearer ${idToken}` }
    }
  )
  return response.data
}

// Chat API calls via backend
export const getUserChats = async (userId, friendsOnly = false, idToken) => {
  const params = friendsOnly ? { friends_only: true } : {}
  const config = {
    params,
    headers: { 'Authorization': `Bearer ${idToken}` }
  }
  const response = await api.get(`/chats/${userId}`, config)
  return response.data
}

export const getChatMessages = async (chatRoomId, idToken) => {
  const response = await api.get(`/chats/room/${chatRoomId}/messages`, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  })
  return response.data
}

export const sendChatMessage = async (messageData, idToken) => {
  const response = await api.post('/chats/messages', messageData, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  })
  return response.data
}

export const getOrCreateChatRoom = async (user1Id, user2Id, productId = null, idToken) => {
  const params = productId ? `?product_id=${productId}` : ''
  const response = await api.get(`/chats/between/${user1Id}/${user2Id}${params}`, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  })
  return response.data
}

export const markChatAsRead = async (chatRoomId, userId, idToken) => {
  const response = await api.put(`/chats/${chatRoomId}/mark-read/${userId}`, {}, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  })
  return response.data
}

export default api


// AI Need Board
export const searchNeedBoard = async (query, idToken) => {
  const response = await api.post('/need-board', { query }, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data // { extracted, rankedResults }
}

// Get Need Board search history
export const getNeedBoardHistory = async (idToken) => {
  const response = await api.get('/need-board/history', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data // { searches, searches_remaining }
}

// Needs API (Demand → Supply Engine)
export const createNeed = async (rawText, idToken) => {
  const response = await api.post('/needs', { raw_text: rawText }, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data // { need, matched_listings }
}

export const getNeedMatches = async (needId, idToken) => {
  const response = await api.get(`/needs/match/${needId}`, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data // { matches }
}

export const getSellerNeedFeed = async (idToken) => {
  const response = await api.get('/needs/seller-feed', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data // { needs, total_count }
}

export const getSellerDemandBanner = async (idToken) => {
  const response = await api.get('/needs/seller-banner', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data // { total_relevant_needs, top_categories, message }
}

export const fulfillNeed = async (needId, productId, idToken) => {
  const response = await api.post(`/needs/${needId}/fulfill`, 
    { product_id: productId }, 
    {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    }
  )
  return response.data
}

export const saveNeed = async (needId, idToken) => {
  const response = await api.post(`/needs/${needId}/save`, {}, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data
}

export const getMyNeeds = async (idToken) => {
  const response = await api.get('/needs/my-needs', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data // { needs }
}
