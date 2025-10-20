import { FormSectionSkeleton, ImageUploaderSkeleton } from '@/components/dynamic/LazyComponents'

export default function AdminValidationDetailLoading() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header Skeleton */}
        <div className='mb-8 animate-pulse'>
          <div className='flex items-center gap-4 mb-4'>
            <div className='h-6 w-6 bg-gray-200 rounded' />
            <div className='h-8 bg-gray-200 rounded w-1/3' />
          </div>
          <div className='h-4 bg-gray-200 rounded w-1/2' />
        </div>

        {/* Product Info Skeleton */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-8'>
            {/* Basic Info */}
            <FormSectionSkeleton />

            {/* Images */}
            <ImageUploaderSkeleton />

            {/* Details */}
            <FormSectionSkeleton />

            {/* Validation Form */}
            <div className='bg-white p-6 rounded-lg shadow animate-pulse'>
              <div className='h-6 bg-gray-200 rounded w-1/3 mb-4' />
              <div className='space-y-4'>
                <div className='h-20 bg-gray-200 rounded' />
                <div className='flex gap-4'>
                  <div className='h-10 bg-green-200 rounded flex-1' />
                  <div className='h-10 bg-red-200 rounded flex-1' />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Host Info */}
            <div className='bg-white p-6 rounded-lg shadow animate-pulse'>
              <div className='h-6 bg-gray-200 rounded w-1/2 mb-4' />
              <div className='space-y-3'>
                <div className='h-4 bg-gray-200 rounded w-3/4' />
                <div className='h-4 bg-gray-200 rounded w-1/2' />
                <div className='h-4 bg-gray-200 rounded w-2/3' />
              </div>
            </div>

            {/* Quick Actions */}
            <div className='bg-white p-6 rounded-lg shadow animate-pulse'>
              <div className='h-6 bg-gray-200 rounded w-1/2 mb-4' />
              <div className='space-y-3'>
                <div className='h-10 bg-blue-200 rounded' />
                <div className='h-10 bg-gray-200 rounded' />
                <div className='h-10 bg-yellow-200 rounded' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
