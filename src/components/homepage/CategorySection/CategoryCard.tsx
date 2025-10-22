'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface CategoryCardProps {
  title: string
  description: string
  imageUrl?: string
  count: number
  href: string
  index: number
}

export default function CategoryCard({
  title,
  description,
  imageUrl,
  count,
  href,
  index,
}: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={href} className='group block'>
        <div className='relative h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300'>
          {/* Background Image */}
          <div
            className='absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800'
            style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
          />

          {/* Overlay Gradient */}
          <div className='absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70 group-hover:from-black/30 group-hover:via-black/50 group-hover:to-black/80 transition-all duration-300' />

          {/* Content */}
          <div className='relative h-full flex flex-col justify-between p-6'>
            {/* Count Badge */}
            <div className='flex justify-end'>
              <Badge
                variant='secondary'
                className='bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30 transition-colors'
              >
                {count} annonces
              </Badge>
            </div>

            {/* Title and Description */}
            <div className='space-y-2'>
              <h3 className='text-2xl md:text-3xl font-bold text-white group-hover:text-[#FFB800] transition-colors'>
                {title}
              </h3>
              <p className='text-white/90 text-sm md:text-base leading-relaxed'>{description}</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
