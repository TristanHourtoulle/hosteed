export default function AdminReservationDetailLoading() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      <div className='container mx-auto p-6 max-w-6xl space-y-6'>
        {/* Back Link Skeleton */}
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-40' />
        </div>

        {/* Header Card Skeleton */}
        <div className='bg-white/90 rounded-2xl p-6 shadow-lg animate-pulse space-y-5'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <div className='h-7 bg-gray-200 rounded w-48' />
                <div className='h-7 bg-gray-200 rounded-full w-24' />
              </div>
              <div className='h-4 bg-gray-200 rounded w-32' />
            </div>
            <div className='text-right space-y-1'>
              <div className='h-3 bg-gray-200 rounded w-20 ml-auto' />
              <div className='h-8 bg-gray-200 rounded w-28' />
            </div>
          </div>
          {/* Timeline skeleton */}
          <div className='flex items-center gap-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='flex items-center gap-3 flex-1'>
                <div className='w-10 h-10 rounded-full bg-gray-200 flex-shrink-0' />
                {i < 3 && <div className='h-0.5 bg-gray-200 flex-1' />}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content: 2/3 + 1/3 layout */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Stay Details Skeleton */}
            <div className='bg-white/90 rounded-2xl shadow-lg animate-pulse'>
              <div className='px-6 py-4 border-b border-gray-100'>
                <div className='h-5 bg-gray-200 rounded w-36' />
              </div>
              <div className='p-6 grid grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <div className='h-4 bg-gray-200 rounded w-3/4' />
                  <div className='h-4 bg-gray-200 rounded w-1/2' />
                </div>
                <div className='space-y-4'>
                  <div className='h-4 bg-gray-200 rounded w-3/4' />
                  <div className='h-4 bg-gray-200 rounded w-1/2' />
                </div>
              </div>
            </div>

            {/* Pricing Skeleton */}
            <div className='bg-white/90 rounded-2xl shadow-lg animate-pulse'>
              <div className='px-6 py-4 border-b border-gray-100'>
                <div className='h-5 bg-gray-200 rounded w-32' />
              </div>
              <div className='p-6 space-y-3'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className='flex justify-between'>
                    <div className='h-4 bg-gray-200 rounded w-1/3' />
                    <div className='h-4 bg-gray-200 rounded w-20' />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Skeleton */}
            <div className='bg-white/90 rounded-2xl shadow-lg animate-pulse'>
              <div className='px-6 py-4 border-b border-gray-100'>
                <div className='h-5 bg-gray-200 rounded w-40' />
              </div>
              <div className='p-6 space-y-4'>
                <div className='flex justify-between'>
                  <div className='h-4 bg-gray-200 rounded w-32' />
                  <div className='h-4 bg-gray-200 rounded w-24' />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className='rounded-xl bg-gray-100 p-3 text-center'>
                      <div className='h-3 bg-gray-200 rounded w-16 mx-auto mb-2' />
                      <div className='h-6 bg-gray-200 rounded w-20 mx-auto' />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className='space-y-6'>
            {/* Actions Skeleton */}
            <div className='bg-white/90 rounded-2xl shadow-lg animate-pulse'>
              <div className='px-6 py-4 border-b border-gray-100'>
                <div className='h-5 bg-gray-200 rounded w-20' />
              </div>
              <div className='p-4 space-y-3'>
                <div className='h-16 bg-gray-100 rounded-xl' />
                <div className='h-16 bg-red-50 rounded-xl' />
              </div>
            </div>

            {/* Guest Skeleton */}
            <div className='bg-white/90 rounded-2xl shadow-lg animate-pulse'>
              <div className='px-6 py-4 border-b border-gray-100'>
                <div className='h-5 bg-gray-200 rounded w-24' />
              </div>
              <div className='p-6 space-y-3'>
                <div className='flex items-center gap-3'>
                  <div className='h-10 w-10 rounded-full bg-gray-200' />
                  <div className='h-4 bg-gray-200 rounded w-32' />
                </div>
                <div className='h-4 bg-gray-200 rounded w-48' />
              </div>
            </div>

            {/* Host Skeleton */}
            <div className='bg-white/90 rounded-2xl shadow-lg animate-pulse'>
              <div className='px-6 py-4 border-b border-gray-100'>
                <div className='h-5 bg-gray-200 rounded w-16' />
              </div>
              <div className='p-6 space-y-3'>
                <div className='flex items-center gap-3'>
                  <div className='h-10 w-10 rounded-full bg-gray-200' />
                  <div className='h-4 bg-gray-200 rounded w-28' />
                </div>
                <div className='h-4 bg-gray-200 rounded w-44' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
