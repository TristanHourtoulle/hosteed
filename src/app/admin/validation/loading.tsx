import { AdminSkeleton } from '@/components/dynamic/LazyComponents'

export default function AdminValidationLoading() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header Skeleton */}
        <div className='mb-8 animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/4 mb-4' />
          <div className='h-4 bg-gray-200 rounded w-1/2' />
        </div>

        {/* Stats Cards Skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='bg-white p-6 rounded-lg shadow animate-pulse'>
              <div className='h-4 bg-gray-200 rounded w-1/2 mb-2' />
              <div className='h-8 bg-gray-200 rounded w-1/3' />
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className='mb-6 animate-pulse'>
          <div className='flex gap-4'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='h-10 bg-gray-200 rounded px-6' />
            ))}
          </div>
        </div>

        {/* Content */}
        <AdminSkeleton />
      </div>
    </div>
  )
}