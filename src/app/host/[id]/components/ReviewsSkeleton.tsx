'use client'

import { motion } from 'framer-motion'

export default function ReviewsSkeleton() {
  return (
    <div className='border-b border-gray-200 pb-12'>
      {/* En-tête skeleton */}
      <div className='mb-8'>
        <div className='flex items-center gap-4 mb-6'>
          <div className='w-12 h-12 bg-gray-200 rounded-full animate-pulse' />
          <div className='space-y-2'>
            <div className='w-20 h-6 bg-gray-200 rounded animate-pulse' />
            <div className='w-16 h-4 bg-gray-200 rounded animate-pulse' />
          </div>
        </div>

        {/* Breakdown skeleton */}
        <div className='bg-gray-50 rounded-xl p-6 border border-gray-100'>
          <div className='w-32 h-6 bg-gray-200 rounded animate-pulse mb-4' />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <div className='w-20 h-4 bg-gray-200 rounded animate-pulse' />
                  <div className='w-8 h-4 bg-gray-200 rounded animate-pulse' />
                </div>
                <div className='w-full h-2.5 bg-gray-200 rounded-full animate-pulse' />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtres skeleton */}
      <div className='mb-6'>
        <div className='flex gap-2'>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className='w-24 h-8 bg-gray-200 rounded-full animate-pulse' />
          ))}
        </div>
      </div>

      {/* Avis skeleton */}
      <div className='space-y-6'>
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className='bg-white rounded-xl border border-gray-100 p-6'
          >
            <div className='flex items-start gap-4'>
              <div className='w-12 h-12 bg-gray-200 rounded-full animate-pulse' />
              <div className='flex-1 space-y-3'>
                {/* En-tête */}
                <div className='flex items-start justify-between'>
                  <div className='space-y-2'>
                    <div className='w-40 h-5 bg-gray-200 rounded animate-pulse' />
                    <div className='w-24 h-4 bg-gray-200 rounded animate-pulse' />
                  </div>
                  <div className='w-20 h-4 bg-gray-200 rounded animate-pulse' />
                </div>

                {/* Contenu */}
                <div className='space-y-2'>
                  <div className='w-full h-4 bg-gray-200 rounded animate-pulse' />
                  <div className='w-4/5 h-4 bg-gray-200 rounded animate-pulse' />
                  <div className='w-3/5 h-4 bg-gray-200 rounded animate-pulse' />
                </div>

                {/* Notes détaillées */}
                <div className='grid grid-cols-5 gap-3 pt-3 border-t border-gray-100'>
                  {[1, 2, 3, 4, 5].map(j => (
                    <div key={j} className='text-center space-y-1'>
                      <div className='w-6 h-6 bg-gray-200 rounded mx-auto animate-pulse' />
                      <div className='w-8 h-4 bg-gray-200 rounded mx-auto animate-pulse' />
                      <div className='w-12 h-3 bg-gray-200 rounded mx-auto animate-pulse' />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
