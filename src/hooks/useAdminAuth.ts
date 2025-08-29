import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useAdminAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Si la session est en cours de chargement, on attend
    if (status === 'loading') {
      return
    }

    // Si pas de session du tout, redirection
    if (status === 'unauthenticated' || !session) {
      router.push('/auth')
      return
    }

    // Si session chargée mais pas admin, redirection
    if (session.user?.roles !== 'ADMIN') {
      router.push('/')
      return
    }

    // Si tout est OK, autoriser l'accès
    setIsAuthorized(true)
  }, [session, status, router])

  return {
    isAuthorized,
    isLoading: status === 'loading' || isAuthorized === null,
    session,
  }
}