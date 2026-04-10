'use client'

import React from 'react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

/**
 * Color palette used by the primary KpiCard variant.
 * Each tone provides a matching icon background and text color.
 */
export type KpiTone =
  | 'slate'
  | 'blue'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'orange'
  | 'red'
  | 'purple'

const TONE_CLASSES: Record<KpiTone, { bg: string; text: string; ring: string }> = {
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'hover:ring-slate-200' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'hover:ring-blue-200' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'hover:ring-indigo-200' },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    ring: 'hover:ring-emerald-200',
  },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'hover:ring-amber-200' },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    ring: 'hover:ring-orange-200',
  },
  red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'hover:ring-red-200' },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    ring: 'hover:ring-purple-200',
  },
}

interface KpiCardProps {
  label: string
  value: number | string
  hint?: string
  icon: LucideIcon
  tone?: KpiTone
  /** If provided, the card becomes a link to this href. */
  href?: string
  /** Loading state — renders a skeleton. */
  loading?: boolean
}

/**
 * Primary KpiCard — large card with big number, icon, and label.
 * Used for the hero KPI row on admin dashboards.
 */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'slate',
  href,
  loading = false,
}: KpiCardProps) {
  const toneClass = TONE_CLASSES[tone]

  if (loading) {
    return (
      <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1 space-y-2'>
            <div className='h-4 w-24 animate-pulse rounded bg-slate-200' />
            <div className='h-9 w-16 animate-pulse rounded bg-slate-200' />
            <div className='h-3 w-32 animate-pulse rounded bg-slate-200' />
          </div>
          <div className='h-12 w-12 animate-pulse rounded-xl bg-slate-200' />
        </div>
      </div>
    )
  }

  const content = (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-transparent transition hover:shadow-md ${toneClass.ring}`}
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-sm font-medium text-slate-500'>{label}</p>
          <p className={`text-4xl font-bold tracking-tight tabular-nums ${toneClass.text}`}>
            {value}
          </p>
          {hint && <p className='text-xs text-slate-500'>{hint}</p>}
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${toneClass.bg} ${toneClass.text}`}
        >
          <Icon className='h-6 w-6' />
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className='block'>
        {content}
      </Link>
    )
  }
  return content
}

interface KpiMetricProps {
  label: string
  value: number | string
  icon: LucideIcon
  tone?: 'slate' | 'emerald' | 'red' | 'blue'
  href?: string
  loading?: boolean
}

const SECONDARY_TONE: Record<
  NonNullable<KpiMetricProps['tone']>,
  string
> = {
  slate: 'text-slate-600',
  emerald: 'text-emerald-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
}

/**
 * Secondary metric chip — compact horizontal row with icon + value + label.
 * Used for context metrics alongside the primary KpiCard row.
 */
export function KpiMetric({
  label,
  value,
  icon: Icon,
  tone = 'slate',
  href,
  loading = false,
}: KpiMetricProps) {
  const toneClass = SECONDARY_TONE[tone]

  if (loading) {
    return (
      <div className='flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 backdrop-blur-sm'>
        <div className='h-5 w-5 animate-pulse rounded bg-slate-200' />
        <div className='flex flex-1 items-center gap-2'>
          <div className='h-6 w-10 animate-pulse rounded bg-slate-200' />
          <div className='h-4 w-24 animate-pulse rounded bg-slate-200' />
        </div>
      </div>
    )
  }

  const content = (
    <div className='flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 backdrop-blur-sm transition hover:bg-white'>
      <div className={toneClass}>
        <Icon className='h-5 w-5' />
      </div>
      <div className='flex items-baseline gap-2'>
        <span className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</span>
        <span className='text-sm font-medium text-slate-600'>{label}</span>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className='block'>
        {content}
      </Link>
    )
  }
  return content
}
