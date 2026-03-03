'use client'

import { Ban } from 'lucide-react'
import { STATUS_TIMELINE, STATUS_ORDER } from '@/lib/constants/reservation'

interface StatusTimelineProps {
  currentStatus: string
}

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  if (currentStatus === 'CANCEL') {
    return (
      <div className='flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3'>
        <Ban className='h-5 w-5 text-red-500' />
        <div>
          <p className='font-medium text-red-700'>Réservation annulée</p>
          <p className='text-sm text-red-500'>Cette réservation a été annulée.</p>
        </div>
      </div>
    )
  }

  const currentIndex = STATUS_ORDER[currentStatus] ?? 0

  return (
    <div className='flex items-start'>
      {STATUS_TIMELINE.map((step, index) => {
        const Icon = step.icon
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={step.key} className='contents'>
            <div className='flex flex-col items-center gap-1.5 flex-shrink-0'>
              <div
                className={`rounded-full p-2.5 transition-colors ${
                  isCompleted
                    ? 'bg-green-100 text-green-600'
                    : isCurrent
                      ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-300'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Icon className='h-4 w-4' />
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isCompleted
                    ? 'text-green-600'
                    : isCurrent
                      ? 'text-blue-600'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STATUS_TIMELINE.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 mt-[17px] rounded-full ${
                  index < currentIndex ? 'bg-green-300' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
