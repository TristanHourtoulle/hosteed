'use client'

import dynamic from 'next/dynamic'
import { ComponentType, ReactElement } from 'react'

// Skeleton components for loading states
export const AdminSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/4" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 bg-gray-200 rounded-lg" />
      ))}
    </div>
  </div>
)

export const EditorSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-10 bg-gray-200 rounded w-full" />
    <div className="h-96 bg-gray-200 rounded" />
    <div className="flex space-x-2">
      <div className="h-8 bg-gray-200 rounded w-20" />
      <div className="h-8 bg-gray-200 rounded w-20" />
    </div>
  </div>
)

export const MapSkeleton = () => (
  <div className="h-64 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
    <div className="text-gray-400">Chargement de la carte...</div>
  </div>
)

export const ChartSkeleton = () => (
  <div className="h-80 bg-gray-200 animate-pulse rounded-lg" />
)

// Heavy components - dynamically imported
export const LazyMarkdownEditor = dynamic(
  () => import('@uiw/react-md-editor').then(mod => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
)







export const LazyPropertyLocation = dynamic(
  () => import('@/app/host/[id]/components/PropertyLocation'),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
)






// Performance monitoring component
export const LazyPerformanceMonitor = dynamic(
  () => import('@/components/PerformanceMonitor'),
  {
    ssr: false,
  }
)

// Export types for TypeScript support
export type LazyComponentProps = {
  [key: string]: unknown
}

// Helper function to create lazy components
export function createLazyComponent<T>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: () => ReactElement
) {
  return dynamic(importFn, {
    ssr: false,
    loading: fallback || (() => <div className="animate-pulse bg-gray-200 h-32 rounded" />),
  })
}

// Preload function for critical lazy components
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload components that will likely be needed soon
    import('@/components/PerformanceMonitor')
    import('@/app/host/[id]/components/PropertyLocation')
  }
}