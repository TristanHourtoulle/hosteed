'use client'

import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function LoadingDisplay() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center'>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='flex items-center gap-3'
      >
        <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
        <p className='text-gray-600 text-lg font-medium'>Chargement des informations...</p>
      </motion.div>
    </div>
  )
}
