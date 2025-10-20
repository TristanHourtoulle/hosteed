'use client'

import { Tag } from 'lucide-react'
import { motion } from 'framer-motion'

interface PromotionBadgeProps {
  discountPercentage: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
}

export default function PromotionBadge({
  discountPercentage,
  size = 'md',
  className = '',
  animated = true,
}: PromotionBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm sm:px-3 sm:py-1.5 sm:text-base',
    lg: 'px-3 py-1.5 text-base sm:px-4 sm:py-2 sm:text-lg',
  }

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3 sm:w-4 sm:h-4',
    lg: 'w-4 h-4 sm:w-5 sm:h-5',
  }

  const Badge = (
    <div
      className={`
        inline-flex items-center gap-1 sm:gap-1.5
        bg-gradient-to-r from-red-600 to-orange-500
        text-white font-bold rounded-full shadow-lg
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <Tag className={iconSizes[size]} />
      <span>-{Math.round(discountPercentage)}%</span>
    </div>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {Badge}
      </motion.div>
    )
  }

  return Badge
}
