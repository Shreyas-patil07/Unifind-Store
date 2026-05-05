/**
 * TypeScript interfaces matching backend Pydantic models
 */

// User Types
export interface User {
  id: string
  name: string
  email: string
  college: string
  firebase_uid: string
  email_verified: boolean
  created_at: string
  avatar?: string
}

export interface UserProfile {
  id: string
  user_id: string
  branch?: string
  avatar?: string
  cover_gradient?: string
  bio?: string
  trust_score: number
  rating: number
  review_count: number
  member_since: string
  phone?: string
  hostel_room?: string
  dark_mode: boolean
  updated_at: string
}

// Product Types
export interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  condition: string
  condition_score: number
  location: string
  images: string[]
  specifications?: Record<string, any>
  seller_id: string
  seller?: {
    id: string
    name: string
    avatar: string | null
  }
  views: number
  viewed_by: string[]
  posted_date: string
  updated_at: string
  is_active: boolean
  sold_to?: string
  sold_at?: string
}

export interface ProductCreate {
  title: string
  description: string
  price: number
  category: string
  condition: string
  condition_score: number
  location: string
  images: string[]
  specifications?: Record<string, any>
  seller_id: string
}

export interface ProductUpdate {
  title?: string
  description?: string
  price?: number
  category?: string
  condition?: string
  condition_score?: number
  location?: string
  images?: string[]
  specifications?: Record<string, any>
}

// Chat Types
export interface Message {
  id: string
  text: string
  sender_id: string
  receiver_id: string
  product_id?: string
  chat_room_id: string
  timestamp: string
  is_read: boolean
}

export interface ChatRoom {
  id: string
  user1_id: string
  user2_id: string
  product_id?: string
  last_message: string
  last_message_time: string
  unread_count_user1: number
  unread_count_user2: number
  created_at: string
  is_friend?: boolean
}

// Review Types
export interface Review {
  id: string
  rating: number
  comment: string
  reviewer_id: string
  reviewed_user_id: string
  product_id?: string
  created_at: string
}

// Need Board Types
export interface ExtractedIntent {
  category: string
  subject: string
  semester: string
  max_price?: number
  condition: string
  intent_summary: string
}

export interface RankedResult {
  id: string | number
  match_score: number
  reason: string
  title?: string
  price?: number
  images?: string[]
}

export interface NeedBoardResponse {
  extracted: ExtractedIntent
  rankedResults: RankedResult[]
  searches_remaining: number
}

export interface NeedBoardHistory {
  searches: Array<{
    timestamp: number
    query: string
    extracted: ExtractedIntent
    results: RankedResult[]
  }>
  searches_remaining: number
}

// Transaction Types
export interface Transaction {
  id: string
  user_id: string
  product_id: string
  transaction_type: 'buy' | 'sell'
  amount: number
  status: 'pending' | 'completed' | 'cancelled'
  other_party_id: string
  created_at: string
  completed_at?: string
}

// Health Check Types
export interface HealthCheck {
  status: 'ok' | 'healthy'
  version: string
  environment?: string
}
