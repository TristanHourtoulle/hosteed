import {
  FormSectionSkeleton,
  ImageUploaderSkeleton,
  ServicesSkeleton,
  PricingSkeleton,
} from '@/components/dynamic/LazyComponents'

export default function CreateProductLoading() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header Skeleton */}
        <div className='text-center mb-8 animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4' />
          <div className='h-4 bg-gray-200 rounded w-1/2 mx-auto' />
        </div>

        {/* Form Sections Skeleton */}
        <div className='max-w-4xl mx-auto space-y-8'>
          {/* Basic Info */}
          <FormSectionSkeleton />

          {/* Location */}
          <FormSectionSkeleton />

          {/* Characteristics */}
          <FormSectionSkeleton />

          {/* Services */}
          <ServicesSkeleton />

          {/* Images */}
          <ImageUploaderSkeleton />

          {/* Pricing */}
          <PricingSkeleton />

          {/* Submit Button */}
          <div className='animate-pulse'>
            <div className='h-12 bg-orange-200 rounded-lg w-full' />
          </div>
        </div>
      </div>
    </div>
  )
}
