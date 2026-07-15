'use client'

import { Camera, AlertTriangle } from 'lucide-react'
import { MAX_LISTING_PHOTOS } from '@/lib/photos/photoBudget'

/**
 * Shared read-out of the listing's photo budget.
 *
 * The 20-photo cap is global (establishment + every room type), and for hotels
 * it is spent on wizard step 2 (room types) but only *felt* on step 4
 * (establishment photos). Rendering the same banner on both steps is what makes
 * that legible: the host sees the tally shrink as they add room-type photos,
 * instead of hitting an unexplained wall later.
 *
 * Presentational only — no modal, no toast; the reason is stated in place.
 */

export type PhotoBudgetTone = 'ok' | 'warning' | 'full'

const WARNING_THRESHOLD = 3

interface PhotoBudgetBannerProps {
  used: number
  remaining: number
  max?: number
  className?: string
}

function toneOf(remaining: number): PhotoBudgetTone {
  if (remaining <= 0) return 'full'
  if (remaining <= WARNING_THRESHOLD) return 'warning'
  return 'ok'
}

const TONE_STYLES: Record<PhotoBudgetTone, { container: string; count: string }> = {
  ok: {
    container: 'border-slate-200 bg-slate-50 text-slate-700',
    count: 'text-slate-900',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-800',
    count: 'text-amber-900',
  },
  full: {
    container: 'border-red-200 bg-red-50 text-red-800',
    count: 'text-red-900',
  },
}

export function PhotoBudgetBanner({
  used,
  remaining,
  max = MAX_LISTING_PHOTOS,
  className = '',
}: PhotoBudgetBannerProps) {
  const tone = toneOf(remaining)
  const styles = TONE_STYLES[tone]

  return (
    <div
      data-testid='photo-budget-banner'
      data-tone={tone}
      className={`flex items-start gap-3 rounded-xl border p-4 ${styles.container} ${className}`}
    >
      <div className='mt-0.5 shrink-0'>
        {tone === 'full' ? (
          <AlertTriangle className='h-5 w-5' aria-hidden='true' />
        ) : (
          <Camera className='h-5 w-5' aria-hidden='true' />
        )}
      </div>
      <div className='space-y-1 text-sm'>
        <p className='font-medium'>
          <span className={styles.count}>
            {used} / {max}
          </span>{' '}
          photos utilisées pour cette annonce
        </p>
        <p>
          {tone === 'full'
            ? `Limite de ${max} photos atteinte. Supprimez une photo — de l'établissement ou d'un type de chambre — pour pouvoir en ajouter une autre.`
            : `Il vous reste ${remaining} photo${remaining > 1 ? 's' : ''}. Ce total est partagé entre les photos de l'établissement et celles de chaque type de chambre.`}
        </p>
      </div>
    </div>
  )
}

export default PhotoBudgetBanner
