'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui/dialog'
import { Button } from '@/components/ui/shadcnui/button'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import { ScrollArea } from '@/components/ui/shadcnui/scroll-area'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Loader2, Trash2, AlertTriangle, Home } from 'lucide-react'
import { TypeRentInterface } from '@/lib/interface/typeRentInterface'
import {
  getProductsByTypeRent,
  deleteTypeRent,
  deleteTypeRentWithProducts,
} from '@/lib/services/typeRent.service'

interface DeleteTypeModalProps {
  isOpen: boolean
  onClose: () => void
  typeToDelete: TypeRentInterface | null
  onDeleteSuccess: (typeId: string) => void
  onError: (message: string) => void
}

interface AssociatedProduct {
  id: string
  title: string | null
  status: string | null
}

export default function DeleteTypeModal({
  isOpen,
  onClose,
  typeToDelete,
  onDeleteSuccess,
  onError,
}: DeleteTypeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingProducts, setIsCheckingProducts] = useState(false)
  const [associatedProducts, setAssociatedProducts] = useState<AssociatedProduct[]>([])
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false)

  useEffect(() => {
    const checkProducts = async () => {
      if (isOpen && typeToDelete) {
        setIsCheckingProducts(true)
        try {
          const products = await getProductsByTypeRent(typeToDelete.id)
          setAssociatedProducts(products)
        } catch (error) {
          console.error('Erreur lors de la vérification des produits associés:', error)
          onError('Erreur lors de la vérification des produits associés')
        } finally {
          setIsCheckingProducts(false)
        }
      } else {
        // Reset state when modal closes
        setAssociatedProducts([])
        setShowFinalConfirmation(false)
      }
    }

    checkProducts()
  }, [isOpen, typeToDelete, onError])

  const handleDelete = async () => {
    if (!typeToDelete) return

    setIsLoading(true)
    try {
      let success = false

      if (associatedProducts.length > 0 && showFinalConfirmation) {
        // Supprimer le type avec tous les produits associés
        success = await deleteTypeRentWithProducts(typeToDelete.id)
      } else {
        // Supprimer uniquement le type (pas de produits associés)
        success = await deleteTypeRent(typeToDelete.id)
      }

      if (success) {
        onDeleteSuccess(typeToDelete.id)
        handleClose()
      } else {
        onError('Erreur lors de la suppression du type de logement')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      onError('Erreur lors de la suppression du type de logement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setAssociatedProducts([])
    setShowFinalConfirmation(false)
    onClose()
  }

  const handleProceedWithProducts = () => {
    setShowFinalConfirmation(true)
  }

  const handleBackFromConfirmation = () => {
    setShowFinalConfirmation(false)
  }

  if (!typeToDelete) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[550px]'>
        {isCheckingProducts ? (
          <>
            <DialogHeader>
              <DialogTitle className='sr-only'>Vérification en cours</DialogTitle>
            </DialogHeader>
            <div className='flex flex-col items-center justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin text-purple-600 mb-4' />
              <p className='text-sm text-slate-600'>Vérification des logements associés...</p>
            </div>
          </>
        ) : showFinalConfirmation ? (
          // Modal de confirmation finale
          <>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-red-600'>
                <AlertTriangle className='h-5 w-5' />
                Confirmation de suppression critique
              </DialogTitle>
              <DialogDescription>Attention ! Cette action est irréversible.</DialogDescription>
            </DialogHeader>

            <Alert variant='destructive' className='my-4'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <strong>ATTENTION :</strong> Vous êtes sur le point de supprimer le type de logement
                &quot;{typeToDelete.name}&quot; ainsi que{' '}
                <strong>{associatedProducts.length} logement(s)</strong> associé(s). Cette action
                est définitive et ne peut pas être annulée.
              </AlertDescription>
            </Alert>

            <div className='text-sm text-slate-600 space-y-2'>
              <p>En confirmant, vous allez supprimer :</p>
              <ul className='list-disc list-inside space-y-1 ml-2'>
                <li>Le type de logement &quot;{typeToDelete.name}&quot;</li>
                <li>Les {associatedProducts.length} logement(s) qui utilisent ce type</li>
                <li>Toutes les réservations associées à ces logements</li>
                <li>Toutes les données liées (images, équipements, etc.)</li>
              </ul>
            </div>

            <DialogFooter className='gap-2'>
              <Button variant='outline' onClick={handleBackFromConfirmation} disabled={isLoading}>
                Retour
              </Button>
              <Button variant='destructive' onClick={handleDelete} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Suppression en cours...
                  </>
                ) : (
                  <>
                    <Trash2 className='h-4 w-4' />
                    Supprimer définitivement
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : associatedProducts.length > 0 ? (
          // Modal avec produits associés
          <>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <AlertTriangle className='h-5 w-5 text-orange-600' />
                Logements associés détectés
              </DialogTitle>
              <DialogDescription>
                Ce type de logement est utilisé par {associatedProducts.length} logement(s). Vous
                devez d&apos;abord modifier leur type ou les supprimer.
              </DialogDescription>
            </DialogHeader>

            <Alert className='my-4 border-orange-200 bg-orange-50'>
              <Home className='h-4 w-4 text-orange-600' />
              <AlertDescription className='text-orange-800'>
                <strong>{associatedProducts.length} logement(s)</strong> utilise(nt) actuellement le
                type &quot;{typeToDelete.name}&quot;
              </AlertDescription>
            </Alert>

            <div className='space-y-3'>
              <p className='text-sm font-medium text-slate-700'>Logements affectés :</p>
              <ScrollArea className='h-[200px] w-full rounded-md border p-4'>
                <div className='space-y-2'>
                  {associatedProducts.map(product => (
                    <div
                      key={product.id}
                      className='flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors'
                    >
                      <span className='text-sm font-medium text-slate-700'>
                        {product.title || 'Sans titre'}
                      </span>
                      <Badge
                        variant='secondary'
                        className={
                          product.status === 'Verified'
                            ? 'bg-green-50 text-green-700'
                            : product.status === 'Rejected'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-yellow-50 text-yellow-700'
                        }
                      >
                        {product.status === 'Verified'
                          ? 'Validé'
                          : product.status === 'Rejected'
                            ? 'Rejeté'
                            : 'En attente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className='text-sm text-slate-600 bg-slate-50 p-3 rounded-lg'>
              <p className='font-medium mb-1'>Options disponibles :</p>
              <ul className='list-disc list-inside space-y-1 text-xs'>
                <li>Modifiez le type de ces logements avant la suppression</li>
                <li>Ou supprimez ces logements individuellement</li>
                <li>Ou forcez la suppression (supprimera tous les logements)</li>
              </ul>
            </div>

            <DialogFooter className='gap-2'>
              <Button variant='outline' onClick={handleClose} disabled={isLoading}>
                Annuler
              </Button>
              <Button
                variant='destructive'
                onClick={handleProceedWithProducts}
                disabled={isLoading}
              >
                <Trash2 className='h-4 w-4' />
                Forcer la suppression
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Modal de suppression simple (pas de produits associés)
          <>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Trash2 className='h-5 w-5 text-red-600' />
                Supprimer le type de logement
              </DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer le type &quot;{typeToDelete.name}&quot; ? Cette
                action est irréversible.
              </DialogDescription>
            </DialogHeader>

            <Alert className='my-4 border-green-200 bg-green-50'>
              <Home className='h-4 w-4 text-green-600' />
              <AlertDescription className='text-green-800'>
                Aucun logement n&apos;utilise ce type. La suppression est sûre.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant='outline' onClick={handleClose} disabled={isLoading}>
                Annuler
              </Button>
              <Button onClick={handleDelete} disabled={isLoading} variant='destructive'>
                {isLoading ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className='h-4 w-4' />
                    Supprimer
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
