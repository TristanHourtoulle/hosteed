import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface UseAuthOptions {
  required?: boolean
  redirectTo?: string
  onUnauthenticated?: () => void
}

/**
 * Hook personnalisé pour gérer l'authentification de manière cohérente
 * Évite les redirections prématurées pendant le chargement de la session
 *
 * @param options - Options de configuration
 * @returns { session, status, isLoading, isAuthenticated }
 */
export function useAuth(options: UseAuthOptions = {}) {
  const { required = true, redirectTo = '/auth', onUnauthenticated } = options

  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (isLoading) return

    // Si l'authentification est requise et que l'utilisateur n'est pas connecté
    if (required && status === 'unauthenticated') {
      if (onUnauthenticated) {
        onUnauthenticated()
      } else {
        router.push(redirectTo)
      }
    }
  }, [status, required, redirectTo, router, onUnauthenticated, isLoading])

  return {
    session,
    status,
    isLoading,
    isAuthenticated,
  }
}
