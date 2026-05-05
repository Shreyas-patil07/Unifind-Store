/**
 * Loading Skeleton Components
 * Tailwind animate-pulse skeletons for various content types
 */

export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-300 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 mb-6">
          <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-700 border-4 border-white dark:border-gray-900" />
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}

export function ChatListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg animate-pulse"
        >
          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"
        />
      ))}
    </div>
  )
}

export function TextSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-300 dark:bg-gray-700 rounded"
          style={{ width: `${Math.random() * 30 + 70}%` }}
        />
      ))}
    </div>
  )
}

export function ButtonSkeleton() {
  return (
    <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" />
  )
}
