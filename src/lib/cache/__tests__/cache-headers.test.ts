/**
 * Unit tests for the HTTP Cache-Control string builders (TRI-1014).
 *
 * These are pure functions: they only assemble a Cache-Control header value.
 * The critical invariant is that `privateNoStore` never allows a shared cache
 * to store an authenticated, per-user response (no `public`, no positive
 * max-age, no stale-while-revalidate).
 */

import { privateNoStore, cdnShort, staticShared } from '../cache-headers'

describe('privateNoStore', () => {
  it('returns the private, no-store directive', () => {
    expect(privateNoStore()).toBe('private, no-store, max-age=0, must-revalidate')
  })

  it('is never publicly cacheable', () => {
    const value = privateNoStore()
    expect(value).toContain('private')
    expect(value).toContain('no-store')
    expect(value).not.toContain('public')
    expect(value).not.toMatch(/max-age=[1-9]/)
    expect(value).not.toMatch(/stale-while-revalidate/)
  })
})

describe('cdnShort', () => {
  it('uses the default s-maxage and stale-while-revalidate window', () => {
    expect(cdnShort()).toBe('public, s-maxage=60, stale-while-revalidate=300')
  })

  it('honours custom values', () => {
    expect(cdnShort(30, 120)).toBe('public, s-maxage=30, stale-while-revalidate=120')
  })
})

describe('staticShared', () => {
  it('uses the default max-age, s-maxage and stale-while-revalidate window', () => {
    expect(staticShared()).toBe(
      'public, max-age=300, s-maxage=300, stale-while-revalidate=86400'
    )
  })

  it('honours custom values', () => {
    expect(staticShared(600, 3600)).toBe(
      'public, max-age=600, s-maxage=600, stale-while-revalidate=3600'
    )
  })
})
