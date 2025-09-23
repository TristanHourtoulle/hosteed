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

// Form skeletons for component splitting
export const FormSectionSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3" />
    <div className="space-y-4">
      <div className="h-10 bg-gray-200 rounded" />
      <div className="h-10 bg-gray-200 rounded" />
      <div className="h-20 bg-gray-200 rounded" />
    </div>
  </div>
)

export const ImageUploaderSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4" />
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
      ))}
    </div>
    <div className="h-12 bg-gray-200 rounded w-full" />
  </div>
)

export const ServicesSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3" />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-200 rounded-full" />
      ))}
    </div>
  </div>
)

export const PricingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-10 bg-gray-200 rounded" />
      <div className="h-10 bg-gray-200 rounded" />
    </div>
    <div className="h-32 bg-gray-200 rounded" />
  </div>
)

// Heavy components - dynamically imported
export const LazyMarkdownEditor = dynamic(
  () => import('@uiw/react-md-editor').then(mod => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
)

// Syntax Highlighter - Only loaded when needed for code display
export const LazySyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then(mod => ({ 
    default: mod.Prism as React.ComponentType<{
      style?: object
      language?: string
      PreTag?: string
      children?: React.ReactNode
      [key: string]: unknown
    }>
  })),
  {
    ssr: false,
    loading: () => <div className="bg-gray-100 rounded p-4 animate-pulse h-20" />,
  }
)

// Stripe Payment Components - Only loaded for payment pages
export const LazyStripeElements = dynamic(
  () => import('@stripe/react-stripe-js').then(mod => ({ 
    default: mod.Elements 
  })),
  {
    ssr: false,
    loading: () => <div className="bg-gray-100 rounded p-6 animate-pulse h-48" />,
  }
)

export const LazyPaymentElement = dynamic(
  () => import('@stripe/react-stripe-js').then(mod => ({ 
    default: mod.PaymentElement 
  })),
  {
    ssr: false,
    loading: () => <div className="bg-gray-100 rounded p-4 animate-pulse h-32" />,
  }
)

// Date Picker - Only loaded when calendar is needed
export const LazyDayPicker = dynamic(
  () => import('react-day-picker').then(mod => ({ 
    default: mod.DayPicker 
  })),
  {
    ssr: false,
    loading: () => <div className="bg-gray-100 rounded p-4 animate-pulse h-64" />,
  }
)

// React Markdown with plugins - Only loaded for content display
export const LazyReactMarkdown = dynamic(
  () => import('react-markdown'),
  {
    ssr: false,
    loading: () => <div className="bg-gray-100 rounded p-4 animate-pulse h-40" />,
  }
)

// TanStack Query DevTools - Only loaded in development
export const LazyReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then(mod => ({ 
    default: mod.ReactQueryDevtools 
  })),
  {
    ssr: false,
    loading: () => null,
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

// Product creation form components - lazy loaded
export const LazyProductBasicInfoForm = createLazyComponent(
  () => import('@/app/createProduct/components/ProductBasicInfoForm'),
  () => <FormSectionSkeleton />
)

export const LazyProductLocationForm = createLazyComponent(
  () => import('@/app/createProduct/components/ProductLocationForm'),
  () => <FormSectionSkeleton />
)

export const LazyProductCharacteristicsForm = createLazyComponent(
  () => import('@/app/createProduct/components/ProductCharacteristicsForm'),
  () => <FormSectionSkeleton />
)

export const LazyProductServicesForm = createLazyComponent(
  () => import('@/app/createProduct/components/ProductServicesForm'),
  () => <ServicesSkeleton />
)

export const LazyProductImageUploader = createLazyComponent(
  () => import('@/app/createProduct/components/ProductImageUploader'),
  () => <ImageUploaderSkeleton />
)

export const LazyProductPricingForm = createLazyComponent(
  () => import('@/app/createProduct/components/ProductPricingForm'),
  () => <PricingSkeleton />
)

// EditProduct form components - lazy loaded
export const LazyEditProductBasicInfoForm = createLazyComponent(
  () => import('@/app/dashboard/host/edit/[id]/components/EditProductBasicInfoForm'),
  () => <FormSectionSkeleton />
)

export const LazyEditProductLocationForm = createLazyComponent(
  () => import('@/app/dashboard/host/edit/[id]/components/EditProductLocationForm'),
  () => <FormSectionSkeleton />
)

export const LazyEditProductCharacteristicsForm = createLazyComponent(
  () => import('@/app/dashboard/host/edit/[id]/components/EditProductCharacteristicsForm'),
  () => <FormSectionSkeleton />
)

export const LazyEditProductServicesForm = createLazyComponent(
  () => import('@/app/dashboard/host/edit/[id]/components/EditProductServicesForm'),
  () => <ServicesSkeleton />
)

export const LazyEditProductImageUploader = createLazyComponent(
  () => import('@/app/dashboard/host/edit/[id]/components/EditProductImageUploader'),
  () => <ImageUploaderSkeleton />
)

export const LazyEditProductPricingForm = createLazyComponent(
  () => import('@/app/dashboard/host/edit/[id]/components/EditProductPricingForm'),
  () => <PricingSkeleton />
)

// Admin validation form components - lazy loaded
export const LazyAdminProductBasicInfoForm = createLazyComponent(
  () => import('@/app/admin/validation/[id]/components/AdminProductBasicInfoForm'),
  () => <FormSectionSkeleton />
)

export const LazyAdminProductLocationForm = createLazyComponent(
  () => import('@/app/admin/validation/[id]/components/AdminProductLocationForm'),
  () => <FormSectionSkeleton />
)

export const LazyAdminProductCharacteristicsForm = createLazyComponent(
  () => import('@/app/admin/validation/[id]/components/AdminProductCharacteristicsForm'),
  () => <FormSectionSkeleton />
)

export const LazyAdminProductServicesForm = createLazyComponent(
  () => import('@/app/admin/validation/[id]/components/AdminProductServicesForm'),
  () => <ServicesSkeleton />
)

export const LazyAdminProductImageManagement = createLazyComponent(
  () => import('@/app/admin/validation/[id]/components/AdminProductImageManagement'),
  () => <ImageUploaderSkeleton />
)

// Preload function for critical lazy components
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload components that will likely be needed soon
    import('@/components/PerformanceMonitor')
    import('@/app/host/[id]/components/PropertyLocation')
  }
}

// Preload function for product creation components
export function preloadProductCreationComponents() {
  if (typeof window !== 'undefined') {
    // Preload first form sections that users will see immediately
    import('@/app/createProduct/components/ProductBasicInfoForm')
    import('@/app/createProduct/components/ProductLocationForm')
  }
}

// Preload function for product editing components
export function preloadProductEditingComponents() {
  if (typeof window !== 'undefined') {
    // Preload first form sections that users will see immediately
    import('@/app/dashboard/host/edit/[id]/components/EditProductBasicInfoForm')
    import('@/app/dashboard/host/edit/[id]/components/EditProductLocationForm')
  }
}

// Preload function for admin validation components
export function preloadAdminValidationComponents() {
  if (typeof window !== 'undefined') {
    // Preload first form sections that admins will see immediately
    import('@/app/admin/validation/[id]/components/AdminProductBasicInfoForm')
    import('@/app/admin/validation/[id]/components/AdminProductLocationForm')
  }
}