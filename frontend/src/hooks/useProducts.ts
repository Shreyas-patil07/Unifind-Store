/**
 * React Query hooks for Products API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as api from '../services/api-service'
import type { Product, ProductCreate, ProductUpdate } from '../types/api'

// Query Keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: any) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  seller: () => [...productKeys.all, 'seller'] as const,
  batch: (ids: string[]) => [...productKeys.all, 'batch', ids] as const,
}

// Queries
export function useProducts(filters?: {
  q?: string
  category?: string
  subcategory?: string
  condition?: string
  min_price?: number
  max_price?: number
  sort?: string
  page?: number
  page_size?: number
}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => api.getProducts(filters),
  })
}

export function useProductsBatch(productIds: string[]) {
  return useQuery({
    queryKey: productKeys.batch(productIds),
    queryFn: () => api.getProductsBatch(productIds),
    enabled: productIds.length > 0,
  })
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => api.getProduct(productId),
    enabled: !!productId,
  })
}

export function useSellerProducts() {
  return useQuery({
    queryKey: productKeys.seller(),
    queryFn: () => {
      console.log('[Hook] useSellerProducts queryFn called - fetching data...')
      return api.getSellerProducts().then(data => {
        console.log('[Hook] useSellerProducts data received:', data)
        return data
      })
    },
    staleTime: 0, // Always consider data stale
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: true, // Always refetch on mount
  })
}

// Mutations
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (product: ProductCreate) => api.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.seller() })
      toast.success('Product created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create product')
    },
  })
}

export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (product: ProductUpdate) => api.updateProduct(productId, product),
    onMutate: async (updatedProduct) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.detail(productId) })
      await queryClient.cancelQueries({ queryKey: productKeys.seller() })

      // Snapshot the previous values
      const previousProduct = queryClient.getQueryData(productKeys.detail(productId))
      const previousSellerProducts = queryClient.getQueryData(productKeys.seller())

      // Optimistically update to the new value
      queryClient.setQueryData(productKeys.detail(productId), (old: any) => ({
        ...old,
        ...updatedProduct,
      }))

      queryClient.setQueryData(productKeys.seller(), (old: any) => {
        if (!Array.isArray(old)) return old
        return old.map((p: any) =>
          p.id === productId ? { ...p, ...updatedProduct } : p
        )
      })

      // Return a context object with the snapshotted values
      return { previousProduct, previousSellerProducts }
    },
    onError: (err, updatedProduct, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProduct) {
        queryClient.setQueryData(productKeys.detail(productId), context.previousProduct)
      }
      if (context?.previousSellerProducts) {
        queryClient.setQueryData(productKeys.seller(), context.previousSellerProducts)
      }
      toast.error('Failed to update product')
    },
    onSuccess: () => {
      toast.success('Product updated successfully!')
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.seller() })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: string) => {
      console.log('[Hook] useDeleteProduct mutationFn called:', { productId })
      return api.deleteProduct(productId)
    },
    onSuccess: (data, productId) => {
      console.log('[Hook] useDeleteProduct onSuccess:', data)
      
      // Immediately update the cache by removing the product
      queryClient.setQueryData(productKeys.seller(), (old: any) => {
        if (!Array.isArray(old)) {
          console.log('[Hook] No old data to update')
          return old
        }
        const filtered = old.filter((p: any) => p.id !== productId)
        console.log('[Hook] Removed product from cache, new count:', filtered.length)
        return filtered
      })
      
      toast.success('Product deleted successfully!')
    },
    onError: (err: any, productId) => {
      console.error('[Hook] useDeleteProduct onError:', err)
      
      // If product not found (404), it's already deleted - remove from cache anyway
      if (err?.detail?.error === 'Not found' || err?.error === 'Not Found') {
        console.log('[Hook] Product already deleted (404), removing from cache')
        queryClient.setQueryData(productKeys.seller(), (old: any) => {
          if (!Array.isArray(old)) return old
          return old.filter((p: any) => p.id !== productId)
        })
        toast.success('Product removed')
      } else {
        toast.error('Failed to delete product')
      }
    },
    onSettled: () => {
      console.log('[Hook] useDeleteProduct onSettled - invalidating queries')
      // Force refetch
      queryClient.invalidateQueries({ 
        queryKey: productKeys.seller(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: productKeys.lists(),
        refetchType: 'active'
      })
    },
  })
}

export function useMarkProductAsSold() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, buyerId }: { productId: string; buyerId?: string }) => {
      console.log('[Hook] useMarkProductAsSold mutationFn called:', { productId, buyerId })
      return api.markProductAsSold(productId, buyerId)
    },
    onMutate: async ({ productId, buyerId }) => {
      console.log('[Hook] useMarkProductAsSold onMutate:', { productId, buyerId })
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.seller() })

      // Snapshot previous value
      const previousData = queryClient.getQueryData(productKeys.seller())
      console.log('[Hook] Previous data:', previousData)

      // Optimistically update
      queryClient.setQueryData(productKeys.seller(), (old: Product[] | undefined) => {
        if (!old) {
          console.log('[Hook] No old data to update')
          return old
        }
        const updated = old.map(p =>
          p.id === productId
            ? { ...p, is_active: false, sold_to: buyerId, sold_at: new Date().toISOString() }
            : p
        )
        console.log('[Hook] Optimistically updated data:', updated)
        return updated
      })

      return { previousData }
    },
    onError: (_err, _vars, context) => {
      console.error('[Hook] useMarkProductAsSold onError:', _err)
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(productKeys.seller(), context.previousData)
      }
      toast.error('Failed to mark as sold')
    },
    onSuccess: (data) => {
      console.log('[Hook] useMarkProductAsSold onSuccess:', data)
      toast.success('Marked as sold!')
    },
    onSettled: () => {
      console.log('[Hook] useMarkProductAsSold onSettled - invalidating queries')
      // Refetch to sync with server - use refetchType: 'active' to force refetch
      queryClient.invalidateQueries({ 
        queryKey: productKeys.seller(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: productKeys.lists(),
        refetchType: 'active'
      })
    },
  })
}

export function useMarkProductAsActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: string) => {
      console.log('[Hook] useMarkProductAsActive mutationFn called:', { productId })
      return api.markProductAsActive(productId)
    },
    onMutate: async (productId) => {
      console.log('[Hook] useMarkProductAsActive onMutate:', { productId })
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.seller() })

      // Snapshot previous value
      const previousData = queryClient.getQueryData(productKeys.seller())
      console.log('[Hook] Previous data:', previousData)

      // Optimistically update
      queryClient.setQueryData(productKeys.seller(), (old: Product[] | undefined) => {
        if (!old) {
          console.log('[Hook] No old data to update')
          return old
        }
        const updated = old.map(p =>
          p.id === productId
            ? { ...p, is_active: true, sold_to: undefined, sold_at: undefined }
            : p
        )
        console.log('[Hook] Optimistically updated data:', updated)
        return updated
      })

      return { previousData }
    },
    onError: (_err, _vars, context) => {
      console.error('[Hook] useMarkProductAsActive onError:', _err)
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(productKeys.seller(), context.previousData)
      }
      toast.error('Failed to mark as active')
    },
    onSuccess: (data) => {
      console.log('[Hook] useMarkProductAsActive onSuccess:', data)
      toast.success('Marked as active!')
    },
    onSettled: () => {
      console.log('[Hook] useMarkProductAsActive onSettled - invalidating queries')
      // Refetch to sync with server - use refetchType: 'active' to force refetch
      queryClient.invalidateQueries({ 
        queryKey: productKeys.seller(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: productKeys.lists(),
        refetchType: 'active'
      })
    },
  })
}
