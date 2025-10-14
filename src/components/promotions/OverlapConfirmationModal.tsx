'use client'

import { ProductPromotion } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui/dialog'
import { Button } from '@/components/ui/shadcnui/button'
import { AlertTriangle } from 'lucide-react'
import { formatPromotionLabel } from '@/lib/utils/promotion'

interface OverlapConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  overlappingPromotions: (ProductPromotion & { product?: { name: string } })[]
  newPromotion: {
    discountPercentage: number
    startDate: string
    endDate: string
  }
  loading?: boolean
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export default function OverlapConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  overlappingPromotions,
  newPromotion,
  loading = false
}: OverlapConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md lg:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-full">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <DialogTitle className="text-lg sm:text-xl">
              Conflit de promotions
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm sm:text-base">
            Les promotions suivantes se chevauchent avec la nouvelle et seront{' '}
            <strong>automatiquement désactivées</strong> :
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          {/* Nouvelle promotion */}
          <div className="mb-4 p-3 sm:p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <div className="text-xs sm:text-sm text-green-700 font-medium mb-1">
              ✓ Nouvelle promotion
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="font-bold text-lg sm:text-xl text-green-800">
                {formatPromotionLabel(newPromotion.discountPercentage)}
              </span>
              <span className="text-xs sm:text-sm text-green-700">
                {formatDate(newPromotion.startDate)} → {formatDate(newPromotion.endDate)}
              </span>
            </div>
          </div>

          {/* Promotions qui seront désactivées */}
          <div className="text-xs sm:text-sm text-gray-700 font-medium mb-2">
            Promotions qui seront désactivées :
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {overlappingPromotions.map((promo) => (
              <div
                key={promo.id}
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base sm:text-lg text-red-700">
                      {formatPromotionLabel(promo.discountPercentage)}
                    </span>
                    {promo.product && (
                      <span className="text-xs text-red-600 truncate">
                        ({promo.product.name})
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-red-600">
                    {formatDate(promo.startDate)} → {formatDate(promo.endDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full sm:w-auto order-2 sm:order-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white order-1 sm:order-2"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Confirmer et désactiver les anciennes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
