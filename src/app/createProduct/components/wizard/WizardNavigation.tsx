'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Plus, Loader2 } from 'lucide-react'

interface WizardNavigationProps {
  isFirstStep: boolean
  isLastStep: boolean
  isSubmitting: boolean
  isUploadingImages: boolean
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
  submitLabel?: string
  submittingLabel?: string
}

export function WizardNavigation({
  isFirstStep,
  isLastStep,
  isSubmitting,
  isUploadingImages,
  onPrevious,
  onNext,
  onSubmit,
  submitLabel = 'Créer l\u0027annonce',
  submittingLabel = 'Création en cours...',
}: WizardNavigationProps) {
  const isDisabled = isSubmitting || isUploadingImages

  return (
    <div className="flex items-center justify-between pt-4">
      {/* Previous button */}
      <div>
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isDisabled}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>
        )}
      </div>

      {/* Next / Submit button */}
      <div>
        {isLastStep ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isDisabled}
            className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
          >
            {isUploadingImages ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Préparation des images...
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {submittingLabel}
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                {submitLabel}
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={isDisabled}
            className="gap-2 bg-gradient-to-r from-[#015993] to-[#0379C7] hover:from-[#014a7a] hover:to-[#0268ab] text-white"
          >
            Suivant
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
