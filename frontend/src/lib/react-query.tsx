/**
 * React Query (TanStack Query) Configuration
 * Centralized server state management
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

// Create a client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 5, // 5 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes (reduced from 10 minutes)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Retry up to 1 time for other errors (reduced from 2)
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false, // Don't refetch on mount if data is fresh
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
})

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
