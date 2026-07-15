/**
 * Single source of truth for "who may edit this listing" (TRI-1028).
 * The rule is: the listing owner, HOST_MANAGER, or ADMIN. Everyone else is
 * refused. This helper is consumed by the server-side guards in
 * `PUT /api/products/[id]` and `PUT /api/products/[id]/images`, and by the host
 * edit page to avoid rendering an editor the user could not save.
 */

import { canManageProduct } from '../product-permissions'

describe('canManageProduct', () => {
  it('allows the owner of the listing', () => {
    expect(canManageProduct({ id: 'u1', roles: 'HOST' }, 'u1')).toBe(true)
  })

  it('allows a HOST_MANAGER who does not own the listing', () => {
    expect(canManageProduct({ id: 'u2', roles: 'HOST_MANAGER' }, 'owner1')).toBe(true)
  })

  it('allows an ADMIN who does not own the listing', () => {
    expect(canManageProduct({ id: 'u3', roles: 'ADMIN' }, 'owner1')).toBe(true)
  })

  it('refuses an authenticated USER who does not own the listing', () => {
    expect(canManageProduct({ id: 'u4', roles: 'USER' }, 'owner1')).toBe(false)
  })

  it('refuses a HOST who does not own the listing', () => {
    expect(canManageProduct({ id: 'u5', roles: 'HOST' }, 'owner1')).toBe(false)
  })

  it('refuses a HOST_VERIFIED who does not own the listing', () => {
    expect(canManageProduct({ id: 'u6', roles: 'HOST_VERIFIED' }, 'owner1')).toBe(false)
  })

  it('refuses an unauthenticated actor', () => {
    expect(canManageProduct(null, 'owner1')).toBe(false)
    expect(canManageProduct(undefined, 'owner1')).toBe(false)
    expect(canManageProduct({ id: undefined, roles: 'ADMIN' }, 'owner1')).toBe(false)
  })

  it('does not treat a missing ownerId as a match for a missing user id', () => {
    expect(canManageProduct({ id: null, roles: 'USER' }, null)).toBe(false)
  })

  it('still allows an elevated role when the ownerId is unknown', () => {
    expect(canManageProduct({ id: 'u7', roles: 'ADMIN' }, null)).toBe(true)
  })

  it('refuses an unknown / malformed role', () => {
    expect(canManageProduct({ id: 'u8', roles: 'SUPERUSER' }, 'owner1')).toBe(false)
    expect(canManageProduct({ id: 'u9', roles: null }, 'owner1')).toBe(false)
  })
})
