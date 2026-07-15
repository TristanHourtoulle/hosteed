import type { UserRole } from '@prisma/client'

/**
 * Who may edit a listing (TRI-1028).
 *
 * A listing is editable by the host who created it (its owner), and by the two
 * elevated roles that manage listings on a host's behalf. Previously each write
 * endpoint inlined this rule; it now lives here so the server guards and the
 * host edit UI cannot drift apart.
 */

/** Roles allowed to manage any listing, regardless of ownership. */
export const PRODUCT_MANAGER_ROLES: readonly UserRole[] = ['ADMIN', 'HOST_MANAGER']

/** The acting user, shaped like `session.user` but tolerant of partial data. */
export interface ProductActor {
  id?: string | null
  roles?: UserRole | string | null
}

/**
 * True when `actor` may edit the listing owned by `ownerId`: owner, HOST_MANAGER
 * or ADMIN. An actor without an id (unauthenticated) is always refused, and a
 * null `ownerId` never matches a null actor id.
 */
export function canManageProduct(
  actor: ProductActor | null | undefined,
  ownerId: string | null | undefined
): boolean {
  if (!actor?.id) return false
  if (ownerId && actor.id === ownerId) return true
  return PRODUCT_MANAGER_ROLES.includes(actor.roles as UserRole)
}
