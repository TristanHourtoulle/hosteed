'use client'

import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isAuthorized, isLoading } = useAdminAuth()

  // Afficher le loader pendant le chargement de la session
  if (isLoading) {
    return (
      fallback || (
        <div className='min-h-screen flex items-center justify-center bg-gray-50'>
          <Card className='w-full max-w-md'>
            <CardContent className='p-8 text-center'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Loader2 className='w-8 h-8 text-blue-600 animate-spin' />
              </div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                Vérification des autorisations
              </h2>
              <p className='text-gray-600'>Veuillez patienter...</p>
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  // Si pas autorisé, afficher un message d'erreur (ne devrait pas arriver car redirection)
  if (!isAuthorized) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8 text-center'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <AlertTriangle className='w-8 h-8 text-red-600' />
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>Accès non autorisé</h2>
            <p className='text-gray-600'>Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si autorisé, afficher le contenu
  return <>{children}</>
}
