'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { STEP_LABELS } from '../../schemas/productFormSchema'

interface WizardStepperProps {
  currentStep: number
  stepValidation: boolean[]
}

export function WizardStepper({ currentStep, stepValidation }: WizardStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, index) => {
          const isCompleted = stepValidation[index] && index < currentStep
          const isCurrent = index === currentStep
          const isPast = index < currentStep

          return (
            <div key={label} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {index > 0 && (
                <div
                  className={cn(
                    'absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2',
                    isPast || isCurrent ? 'bg-blue-500' : 'bg-gray-200'
                  )}
                />
              )}

              {/* Step circle */}
              <div
                className={cn(
                  'relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                  isCurrent && 'bg-[#015993] text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100',
                  isCompleted && 'bg-green-500 text-white',
                  isPast && !isCompleted && 'bg-blue-500 text-white',
                  !isCurrent && !isPast && !isCompleted && 'bg-gray-200 text-gray-500'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>

              {/* Step label */}
              <span
                className={cn(
                  'mt-2 text-xs font-medium text-center hidden sm:block',
                  isCurrent ? 'text-[#015993]' : 'text-gray-500'
                )}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
