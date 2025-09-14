import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { UserRole } from '@prisma/client'

interface UseMultiRoleAuthOptions {
  allowedRoles: UserRole[]
  redirectTo?: string
  redirectUnauthorized?: string
}

export function useMultiRoleAuth(options: UseMultiRoleAuthOptions) {
  const {
    allowedRoles,
    redirectTo = '/auth',
    redirectUnauthorized = '/'
  } = options

  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Si la session est en cours de chargement, on attend
    if (status === 'loading') {
      return
    }

    // Si pas de session du tout, redirection vers login
    if (status === 'unauthenticated' || !session) {
      router.push(redirectTo)
      return
    }

    // Si session chargée mais rôle non autorisé, redirection
    if (!session.user?.roles || !allowedRoles.includes(session.user.roles)) {
      router.push(redirectUnauthorized)
      return
    }

    // Si tout est OK, autoriser l'accès
    setIsAuthorized(true)
  }, [session, status, router, allowedRoles, redirectTo, redirectUnauthorized])

  return {
    isAuthorized,
    isLoading: status === 'loading' || isAuthorized === null,
    session,
    userRole: session?.user?.roles || null,
  }
}

// Hook spécialisé pour l'accès admin (ADMIN + HOST_MANAGER)
export function useAdminAuth() {
  return useMultiRoleAuth({
    allowedRoles: ['ADMIN', 'HOST_MANAGER']
  })
}

// Hook spécialisé pour l'accès admin complet (ADMIN seulement)
export function useFullAdminAuth() {
  return useMultiRoleAuth({
    allowedRoles: ['ADMIN']
  })
}

// Hook spécialisé pour l'accès host (tous les rôles host + admin)
export function useHostAuth() {
  return useMultiRoleAuth({
    allowedRoles: ['HOST', 'HOST_VERIFIED', 'HOST_MANAGER', 'ADMIN']
  })
}

// Utilitaire pour vérifier les permissions côté client
export function hasRole(userRole: UserRole | null | undefined, allowedRoles: UserRole[]): boolean {
  return userRole ? allowedRoles.includes(userRole) : false
}

// Utilitaire pour vérifier si un utilisateur est admin (ADMIN ou HOST_MANAGER)
export function isAdmin(userRole: UserRole | null | undefined): boolean {
  return hasRole(userRole, ['ADMIN', 'HOST_MANAGER'])
}

// Utilitaire pour vérifier si un utilisateur est admin complet (ADMIN seulement)
export function isFullAdmin(userRole: UserRole | null | undefined): boolean {
  return hasRole(userRole, ['ADMIN'])
}

// Utilitaire pour vérifier si un utilisateur peut gérer les hosts
export function canManageHosts(userRole: UserRole | null | undefined): boolean {
  return hasRole(userRole, ['HOST', 'HOST_VERIFIED', 'HOST_MANAGER', 'ADMIN'])
}

// Hook spécialisé pour l'accès blog (BLOGWRITER + ADMIN)
export function useBlogAuth() {
  return useMultiRoleAuth({
    allowedRoles: ['ADMIN', 'BLOGWRITER']
  })
}

// Utilitaire pour vérifier si un utilisateur peut gérer les blogs
export function canManageBlogs(userRole: UserRole | null | undefined): boolean {
  return hasRole(userRole, ['ADMIN', 'BLOGWRITER'])
}