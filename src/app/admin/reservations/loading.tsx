export default function AdminReservationsLoading() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      <div className='container mx-auto p-6 space-y-8'>
        {/* Header Skeleton */}
        <div className='text-center space-y-4 animate-pulse'>
          <div className='mx-auto w-16 h-16 rounded-full bg-gray-200' />
          <div className='h-8 bg-gray-200 rounded w-1/3 mx-auto' />
          <div className='h-4 bg-gray-200 rounded w-1/2 mx-auto' />
        </div>

        {/* Stats Cards Skeleton */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='bg-white/80 p-4 rounded-2xl shadow-lg animate-pulse'>
              <div className='h-3 bg-gray-200 rounded w-2/3 mb-2' />
              <div className='h-7 bg-gray-200 rounded w-1/3' />
            </div>
          ))}
        </div>

        {/* Search Skeleton */}
        <div className='bg-white/80 rounded-2xl p-6 shadow-lg animate-pulse'>
          <div className='h-10 bg-gray-200 rounded-xl w-full max-w-md' />
        </div>

        {/* Reservation Cards Skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='bg-white/80 rounded-2xl p-5 shadow-lg animate-pulse space-y-4'>
              <div className='space-y-2'>
                <div className='h-5 bg-gray-200 rounded w-3/4' />
                <div className='h-3 bg-gray-200 rounded w-1/2' />
              </div>
              <div className='flex gap-2'>
                <div className='h-6 bg-gray-200 rounded-full w-20' />
                <div className='h-6 bg-gray-200 rounded-full w-16' />
              </div>
              <div className='space-y-2'>
                <div className='h-4 bg-gray-200 rounded w-full' />
                <div className='h-4 bg-gray-200 rounded w-3/4' />
              </div>
              <div className='h-8 bg-gray-100 rounded-xl' />
              <div className='flex justify-between pt-2 border-t border-gray-100'>
                <div className='h-4 bg-gray-200 rounded w-20' />
                <div className='h-6 bg-gray-200 rounded w-24' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
