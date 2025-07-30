'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { motion } from 'framer-motion'
import { ArrowRight, LucideIcon } from 'lucide-react'

interface ActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  badge?: string | null
  badgeVariant?: 'destructive' | 'secondary'
  priority?: 'high' | 'medium' | 'low'
}

export function ActionCard({
  title,
  description,
  href,
  icon,
  badge,
  badgeVariant = 'secondary',
  priority = 'medium',
}: ActionCardProps) {
  const priorityStyles = {
    high: 'ring-2 ring-red-200 hover:ring-red-300',
    medium: 'hover:ring-2 hover:ring-blue-200',
    low: 'hover:ring-2 hover:ring-slate-200',
  }

  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className='h-full'>
      <Link href={href} className='block h-full'>
        <Card
          className={`
          h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 
          bg-white/70 backdrop-blur-sm hover:bg-white/90 group
          ${priorityStyles[priority]}
        `}
        >
          <CardHeader className='pb-3'>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-3 flex-1'>
                <div className='p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors shrink-0'>
                  {React.createElement(icon, { className: 'h-6 w-6 text-slate-700' })}
                </div>
                <div className='min-w-0 flex-1'>
                  <CardTitle className='text-lg font-semibold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2'>
                    {title}
                  </CardTitle>
                  <CardDescription className='text-slate-600 text-sm mt-1 line-clamp-2'>
                    {description}
                  </CardDescription>
                </div>
              </div>
              <ArrowRight className='h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0 ml-2' />
            </div>

            {badge && (
              <div className='mt-3'>
                <Badge variant={badgeVariant} className='text-xs'>
                  {badge}
                </Badge>
              </div>
            )}
          </CardHeader>
        </Card>
      </Link>
    </motion.div>
  )
}

interface ActionCardGroupProps {
  title: string
  description: string
  icon: LucideIcon
  cards: ActionCardProps[]
  className?: string
}

export function ActionCardGroup({
  title,
  description,
  icon: Icon,
  cards,
  className = '',
}: ActionCardGroupProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className='flex items-center gap-3'>
        <div className='p-2 bg-slate-100 rounded-lg'>
          <Icon className='h-6 w-6 text-slate-700' />
        </div>
        <div>
          <h2 className='text-2xl font-bold text-slate-800'>{title}</h2>
          <p className='text-slate-600'>{description}</p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.05,
              type: 'spring',
              stiffness: 100,
              damping: 15,
            }}
          >
            <ActionCard {...card} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
