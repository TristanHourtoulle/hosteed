'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'

interface PageHeaderProps {
  /** Small uppercase pill shown above the title (e.g. "Espace administrateur"). */
  eyebrow?: string
  /** Optional icon displayed inside the eyebrow pill. */
  eyebrowIcon?: LucideIcon
  /** Main page title. Rendered with a gradient. */
  title: string
  /** Optional subtitle / description under the title. */
  subtitle?: string
  /** Optional breadcrumb back link shown above the header. */
  backHref?: string
  /** Label for the back link. Defaults to "Retour". */
  backLabel?: string
  /** Right-side actions slot (buttons, etc.). */
  actions?: React.ReactNode
}

/**
 * Unified page header for admin pages.
 *
 * Layout:
 *   [ ← back link                                           ]
 *   [ eyebrow pill                        [right actions] ]
 *   [ gradient title                                       ]
 *   [ subtitle                                             ]
 */
export function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  subtitle,
  backHref,
  backLabel = 'Retour',
  actions,
}: PageHeaderProps) {
  return (
    <div className='space-y-4'>
      {backHref && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant='ghost'
            size='sm'
            asChild
            className='text-slate-600 hover:text-slate-900'
          >
            <Link href={backHref}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              {backLabel}
            </Link>
          </Button>
        </motion.div>
      )}

      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='space-y-3'>
          {eyebrow && (
            <span className='inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700'>
              {EyebrowIcon && <EyebrowIcon className='h-3.5 w-3.5' />}
              {eyebrow}
            </span>
          )}
          <h1 className='bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl'>
            {title}
          </h1>
          {subtitle && (
            <p className='max-w-2xl text-base text-slate-600'>{subtitle}</p>
          )}
        </div>

        {actions && <div className='shrink-0'>{actions}</div>}
      </div>
    </div>
  )
}
