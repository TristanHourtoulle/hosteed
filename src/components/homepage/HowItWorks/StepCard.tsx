'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StepCardProps {
  number: number
  icon: LucideIcon
  title: string
  description: string
  index: number
}

export default function StepCard({ number, icon: Icon, title, description, index }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className='relative'
    >
      <div className='flex gap-4 md:gap-6 group'>
        {/* Number Badge */}
        <div className='flex-shrink-0'>
          <div className='w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#015993] to-[#0379C7] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all'>
            <span className='text-white font-bold text-lg md:text-xl'>{number}</span>
          </div>
        </div>

        {/* Content Card */}
        <div className='flex-1 bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border border-gray-100 group-hover:border-[#0379C7]/30'>
          <div className='flex items-start gap-4'>
            {/* Icon */}
            <div className='flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-[#015993]/10 to-[#0379C7]/10 flex items-center justify-center group-hover:scale-110 transition-transform'>
              <Icon className='w-6 h-6 text-[#015993]' />
            </div>

            {/* Text */}
            <div className='flex-1'>
              <h3 className='text-lg md:text-xl font-bold text-gray-900 mb-2 group-hover:text-[#015993] transition-colors'>
                {title}
              </h3>
              <p className='text-gray-600 text-sm md:text-base leading-relaxed'>{description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connecting Line (except for last item) */}
      {index < 3 && (
        <div className='absolute left-6 md:left-7 top-14 md:top-16 w-0.5 h-12 bg-gradient-to-b from-[#0379C7] to-[#0379C7]/20' />
      )}
    </motion.div>
  )
}
