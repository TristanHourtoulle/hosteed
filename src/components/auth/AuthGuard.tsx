'use client'

import { useAuth } from '@/hooks/useAuth'
import { ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
  required?: boolean
  redirectTo?: string
  loadingComponent?: ReactNode
}

/**
 * Composant de protection d'authentification
 * Affiche un loader pendant la vérification de la session
 * Redirige si nécessaire une fois la session chargée
 */
export function AuthGuard({
  children,
  required = true,
  redirectTo = '/auth',
  loadingComponent,
}: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useAuth({
    required,
    redirectTo,
  })

  // Afficher le loader pendant la vérification de la session
  if (isLoading) {
    return (
      loadingComponent || (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='flex flex-col items-center gap-4'>
            <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
            <p className='text-slate-600 text-lg'>Chargement...</p>
          </div>
        </div>
      )
    )
  }

  // Si l'authentification est requise mais l'utilisateur n'est pas connecté,
  // le hook useAuth gère la redirection
  if (required && !isAuthenticated) {
    return null
  }

  // Afficher le contenu protégé
  return <>{children}</>
}
