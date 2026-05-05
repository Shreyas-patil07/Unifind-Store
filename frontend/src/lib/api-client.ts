/**
 * Centralized API Client for UNIFIND Frontend
 * Handles authentication, error handling, retries, and request deduplication
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

// Validate environment variables at startup
const API_BASE_URL = import.meta.env.VITE_API_URL
if (!API_BASE_URL) {
  throw new Error('VITE_API_URL environment variable is required')
}

// Types
export interface ApiError {
  error: string
  detail: any
  message: string
}

export interface ApiResponse<T = any> {
  data: T
  status: number
}

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>()

/**
 * Generate a unique key for request deduplication
 */
function getRequestKey(config: AxiosRequestConfig): string {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`
}

/**
 * Get authentication token from Firebase Auth
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // Dynamically import Firebase auth to avoid circular dependencies
    const { auth } = await import('../services/firebase')
    const user = auth.currentUser
    if (user) {
      return await user.getIdToken()
    }
    return null
  } catch (error) {
    console.error('Failed to get auth token:', error)
    return null
  }
}

/**
 * Clear authentication token and redirect to login
 */
export function clearAuthAndRedirect(): void {
  // Sign out from Firebase
  import('../services/firebase').then(({ auth }) => {
    auth.signOut()
  })
  window.location.href = '/login'
}

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized - clear token and redirect
    if (error.response?.status === 401) {
      clearAuthAndRedirect()
      return Promise.reject({
        message: 'Session expired. Please login again.',
        error: 'Unauthorized',
        detail: error.response.data?.detail,
      })
    }

    // Handle 422 Unprocessable Entity - validation errors
    if (error.response?.status === 422) {
      const validationErrors = error.response.data?.detail
      return Promise.reject({
        message: 'Validation failed',
        error: 'Validation Error',
        detail: validationErrors,
      })
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        error: 'Network Error',
        detail: error.message,
      })
    }

    // Parse error response
    const apiError: ApiError = {
      error: error.response.data?.error || 'Unknown Error',
      detail: error.response.data?.detail || error.message,
      message:
        typeof error.response.data?.detail === 'string'
          ? error.response.data.detail
          : error.response.data?.error || 'An error occurred',
    }

    return Promise.reject(apiError)
  }
)

/**
 * Make a GET request with automatic retry and deduplication
 */
export async function get<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const requestConfig: AxiosRequestConfig = {
    ...config,
    method: 'GET',
    url,
  }

  const requestKey = getRequestKey(requestConfig)

  // Check if identical request is already pending
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)!
  }

  // Create request with retry logic
  const requestPromise = retryRequest<T>(() =>
    apiClient.get<T>(url, config).then((res) => res.data)
  )

  // Store pending request
  pendingRequests.set(requestKey, requestPromise)

  try {
    const result = await requestPromise
    return result
  } finally {
    // Clean up pending request
    pendingRequests.delete(requestKey)
  }
}

/**
 * Make a POST request
 */
export async function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config)
  return response.data
}

/**
 * Make a PUT request
 */
export async function put<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config)
  return response.data
}

/**
 * Make a PATCH request
 */
export async function patch<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  console.log('[API Client] PATCH request:', { url, data, config })
  const response = await apiClient.patch<T>(url, data, config)
  console.log('[API Client] PATCH response:', { url, status: response.status, data: response.data })
  return response.data
}

/**
 * Make a DELETE request
 */
export async function del<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  console.log('[API Client] DELETE request:', { url, config })
  const response = await apiClient.delete<T>(url, config)
  console.log('[API Client] DELETE response:', { url, status: response.status, data: response.data })
  return response.data
}

/**
 * Retry failed GET requests with exponential backoff
 */
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error: any) {
      lastError = error

      // Don't retry on 4xx errors (except 429 Too Many Requests)
      if (
        error.response?.status >= 400 &&
        error.response?.status < 500 &&
        error.response?.status !== 429
      ) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Create an AbortController for cancelling requests
 */
export function createAbortController(): AbortController {
  return new AbortController()
}

/**
 * Make a request with cancellation support
 */
export async function getWithCancel<T = any>(
  url: string,
  signal: AbortSignal,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.get<T>(url, {
    ...config,
    signal,
  })
  return response.data
}

export default apiClient
