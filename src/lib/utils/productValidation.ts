import { ProductValidation } from '@prisma/client'

/**
 * Traduit le statut de validation d'un produit en français
 */
export function getValidationStatusLabel(status: ProductValidation): string {
  switch (status) {
    case ProductValidation.NotVerified:
      return 'En attente'
    case ProductValidation.Approve:
      return 'Validé'
    case ProductValidation.Refused:
      return 'Refusé'
    case ProductValidation.RecheckRequest:
      return 'Révision demandée'
    case ProductValidation.ModificationPending:
      return 'Modification en attente'
    default:
      return 'Inconnu'
  }
}

/**
 * Retourne la variante de badge appropriée pour un statut de validation
 */
export function getValidationStatusVariant(
  status: ProductValidation
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case ProductValidation.Approve:
      return 'default'
    case ProductValidation.Refused:
      return 'destructive'
    case ProductValidation.NotVerified:
    case ProductValidation.RecheckRequest:
    case ProductValidation.ModificationPending:
      return 'secondary'
    default:
      return 'outline'
  }
}

/**
 * Retourne les classes CSS personnalisées pour un statut de validation
 */
export function getValidationStatusClassName(status: ProductValidation): string {
  switch (status) {
    case ProductValidation.NotVerified:
      return 'bg-yellow-100 text-yellow-800'
    case ProductValidation.Approve:
      return 'bg-green-100 text-green-800'
    case ProductValidation.Refused:
      return 'bg-red-100 text-red-800'
    case ProductValidation.RecheckRequest:
      return 'bg-orange-100 text-orange-800'
    case ProductValidation.ModificationPending:
      return 'bg-blue-100 text-blue-800 border-blue-300'
    default:
      return ''
  }
}
