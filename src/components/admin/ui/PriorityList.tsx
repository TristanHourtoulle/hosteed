'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Check, LucideIcon } from 'lucide-react'

interface PriorityItemProps {
  icon: LucideIcon
  title: string
  description: string
  count: number
  href: string
  /** Color tone for the count badge + icon. */
  tone: 'amber' | 'blue' | 'purple' | 'emerald' | 'red'
}

const TONE: Record<
  PriorityItemProps['tone'],
  { iconBg: string; iconText: string; badge: string; hoverBorder: string }
> = {
  amber: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    hoverBorder: 'hover:border-amber-300',
  },
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
    hoverBorder: 'hover:border-blue-300',
  },
  purple: {
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-800 ring-1 ring-purple-200',
    hoverBorder: 'hover:border-purple-300',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
    hoverBorder: 'hover:border-emerald-300',
  },
  red: {
    iconBg: 'bg-red-50',
    iconText: 'text-red-600',
    badge: 'bg-red-100 text-red-800 ring-1 ring-red-200',
    hoverBorder: 'hover:border-red-300',
  },
}

function PriorityItem({
  icon: Icon,
  title,
  description,
  count,
  href,
  tone,
}: PriorityItemProps) {
  const toneClass = TONE[tone]

  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 transition hover:shadow-md ${toneClass.hoverBorder}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClass.iconBg} ${toneClass.iconText}`}
      >
        <Icon className='h-5 w-5' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-semibold text-slate-900'>{title}</p>
        <p className='truncate text-xs text-slate-500'>{description}</p>
      </div>
      <span
        className={`inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full px-2.5 text-sm font-bold tabular-nums ${toneClass.badge}`}
      >
        {count}
      </span>
      <ArrowRight className='h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600' />
    </Link>
  )
}

interface PriorityListProps {
  title?: string
  items: PriorityItemProps[]
  loading?: boolean
  /** Message shown when there are no items with count > 0. */
  emptyTitle?: string
  emptySubtitle?: string
}

/**
 * A vertical list of prioritized actions for the admin dashboard.
 * Items with count === 0 are hidden by default, and if no items remain
 * an "all clear" empty state is rendered instead.
 */
export function PriorityList({
  title = 'Priorités du jour',
  items,
  loading = false,
  emptyTitle = 'Tout est à jour',
  emptySubtitle = "Aucune action urgente ne vous attend. Profitez-en pour explorer le reste du panel.",
}: PriorityListProps) {
  const visibleItems = items.filter(i => i.count > 0)

  return (
    <div className='rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-slate-900'>{title}</h2>
        {!loading && visibleItems.length > 0 && (
          <span className='rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600'>
            {visibleItems.length} {visibleItems.length > 1 ? 'actions' : 'action'}
          </span>
        )}
      </div>

      {loading ? (
        <div className='space-y-3'>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className='flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4'
            >
              <div className='h-11 w-11 animate-pulse rounded-xl bg-slate-200' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 w-40 animate-pulse rounded bg-slate-200' />
                <div className='h-3 w-56 animate-pulse rounded bg-slate-200' />
              </div>
              <div className='h-7 w-10 animate-pulse rounded-full bg-slate-200' />
            </div>
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 py-10 px-6 text-center'>
          <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'>
            <Check className='h-6 w-6' />
          </div>
          <h3 className='text-base font-semibold text-slate-900'>{emptyTitle}</h3>
          <p className='mt-1 max-w-sm text-sm text-slate-500'>{emptySubtitle}</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {visibleItems.map(item => (
            <PriorityItem key={item.href} {...item} />
          ))}
        </div>
      )}
    </div>
  )
}
