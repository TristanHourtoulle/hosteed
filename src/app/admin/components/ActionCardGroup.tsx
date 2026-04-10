'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, LucideIcon } from 'lucide-react'

export type ActionCardTone =
  | 'slate'
  | 'blue'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'orange'
  | 'red'
  | 'purple'

const TONE_CLASSES: Record<
  ActionCardTone,
  {
    iconBg: string
    iconText: string
    hoverBorder: string
    accent: string
  }
> = {
  slate: {
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    hoverBorder: 'hover:border-slate-300',
    accent: 'group-hover:text-slate-700',
  },
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    hoverBorder: 'hover:border-blue-300',
    accent: 'group-hover:text-blue-700',
  },
  indigo: {
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-600',
    hoverBorder: 'hover:border-indigo-300',
    accent: 'group-hover:text-indigo-700',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    hoverBorder: 'hover:border-emerald-300',
    accent: 'group-hover:text-emerald-700',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    hoverBorder: 'hover:border-amber-300',
    accent: 'group-hover:text-amber-700',
  },
  orange: {
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-600',
    hoverBorder: 'hover:border-orange-300',
    accent: 'group-hover:text-orange-700',
  },
  red: {
    iconBg: 'bg-red-50',
    iconText: 'text-red-600',
    hoverBorder: 'hover:border-red-300',
    accent: 'group-hover:text-red-700',
  },
  purple: {
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
    hoverBorder: 'hover:border-purple-300',
    accent: 'group-hover:text-purple-700',
  },
}

interface ActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  badge?: string | null
  badgeVariant?: 'destructive' | 'secondary'
  tone?: ActionCardTone
}

export function ActionCard({
  title,
  description,
  href,
  icon: Icon,
  badge,
  badgeVariant = 'secondary',
  tone = 'slate',
}: ActionCardProps) {
  const toneClass = TONE_CLASSES[tone]
  const badgeClass =
    badgeVariant === 'destructive'
      ? 'bg-red-100 text-red-800 ring-1 ring-red-200'
      : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'

  return (
    <Link href={href} className='block h-full'>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: 'tween', duration: 0.2 }}
        className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md ${toneClass.hoverBorder}`}
      >
        <div className='flex items-start justify-between gap-3'>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClass.iconBg} ${toneClass.iconText}`}
          >
            <Icon className='h-5 w-5' />
          </div>
          <ArrowUpRight className='h-4 w-4 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-600' />
        </div>

        <div className='mt-4 space-y-1'>
          <h3
            className={`text-base font-semibold leading-tight text-slate-900 transition ${toneClass.accent}`}
          >
            {title}
          </h3>
          <p className='line-clamp-2 text-sm text-slate-500'>{description}</p>
        </div>

        {badge && (
          <div className='mt-4'>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
            >
              {badge}
            </span>
          </div>
        )}
      </motion.div>
    </Link>
  )
}

interface ActionCardGroupProps {
  title: string
  description: string
  icon: LucideIcon
  /** Color tone for the group header icon chip. Defaults to slate. */
  tone?: ActionCardTone
  cards: (ActionCardProps & { tone?: ActionCardTone })[]
  className?: string
}

export function ActionCardGroup({
  title,
  description,
  icon: Icon,
  tone = 'slate',
  cards,
  className = '',
}: ActionCardGroupProps) {
  const headerTone = TONE_CLASSES[tone]

  return (
    <div className={`space-y-5 ${className}`}>
      <div className='flex items-center gap-3'>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${headerTone.iconBg} ${headerTone.iconText}`}
        >
          <Icon className='h-5 w-5' />
        </div>
        <div>
          <h2 className='text-xl font-semibold text-slate-900'>{title}</h2>
          <p className='text-sm text-slate-500'>{description}</p>
        </div>
      </div>

      <motion.div
        className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
        initial='hidden'
        animate='visible'
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.04 },
          },
        }}
      >
        {cards.map(card => (
          <motion.div
            key={card.title}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { type: 'tween', duration: 0.3, ease: 'easeOut' },
              },
            }}
          >
            <ActionCard {...card} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
