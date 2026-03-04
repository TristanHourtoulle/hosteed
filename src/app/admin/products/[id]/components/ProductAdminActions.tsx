'use client'

import { useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/shadcnui/alert-dialog'
import { ShieldCheck, ShieldX, Trash2, Settings } from 'lucide-react'
import { ProductValidation } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface ProductAdminActionsProps {
  productId: string
  productName: string
  validationStatus: ProductValidation
  onValidate: () => Promise<void>
  onReject: () => Promise<void>
  onDelete: () => Promise<void>
}

/** Admin sidebar actions: validate, reject, delete based on current validation status. */
export function ProductAdminActions({
  productName,
  validationStatus,
  onValidate,
  onReject,
  onDelete,
}: ProductAdminActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true)
    try {
      await action()
    } finally {
      setIsProcessing(false)
    }
  }

  const showValidate =
    validationStatus === ProductValidation.NotVerified ||
    validationStatus === ProductValidation.Refused

  const showReject =
    validationStatus === ProductValidation.NotVerified ||
    validationStatus === ProductValidation.Approve

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <Settings className='h-5 w-5 text-blue-600' />
            Actions
          </h2>
        </div>
        <CardContent className='p-6 space-y-3'>
          {showValidate && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className='w-full bg-green-600 hover:bg-green-700 text-white'
                  disabled={isProcessing}
                >
                  <ShieldCheck className='h-4 w-4 mr-2' />
                  Valider
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Valider cet hébergement ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    L&apos;hébergement &quot;{productName}&quot; sera visible publiquement
                    après validation.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    className='bg-green-600 hover:bg-green-700'
                    onClick={() => handleAction(onValidate)}
                  >
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {showReject && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='outline'
                  className='w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                  disabled={isProcessing}
                >
                  <ShieldX className='h-4 w-4 mr-2' />
                  Refuser
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Refuser cet hébergement ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    L&apos;hébergement &quot;{productName}&quot; sera marqué comme refusé. Le
                    propriétaire sera notifié.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    className='bg-red-600 hover:bg-red-700'
                    onClick={() => handleAction(onReject)}
                  >
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant='outline'
                className='w-full border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800'
                disabled={isProcessing}
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. L&apos;hébergement &quot;{productName}&quot;
                  et toutes ses données associées seront supprimés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className='bg-red-600 hover:bg-red-700'
                  onClick={() => handleAction(onDelete)}
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </motion.div>
  )
}
