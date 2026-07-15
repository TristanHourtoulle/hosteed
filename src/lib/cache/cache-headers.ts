/**
 * Centralised `Cache-Control` header builders (TRI-1014, part of the cache
 * consolidation epic TRI-1013).
 *
 * These are pure string builders with no side effects so they can be shared by
 * route handlers and unit-tested in isolation. They encode the three caching
 * postures used across the app:
 *
 * - `privateNoStore`  — authenticated, per-user or admin responses that must
 *   never touch a shared/CDN cache and must always be revalidated.
 * - `cdnShort`        — public data that a CDN may cache briefly and serve
 *   stale while revalidating in the background.
 * - `staticShared`    — rarely-changing public reference data (types,
 *   equipments, meals, services, security options).
 */

/**
 * Header for authenticated, user-specific or admin responses. It forbids any
 * caching (browser or shared/CDN) to avoid cache leaks/poisoning and stale
 * data after a mutation.
 */
export function privateNoStore(): string {
  return 'private, no-store, max-age=0, must-revalidate'
}

/**
 * Header for public data that may be briefly cached by a shared/CDN layer and
 * served stale while it revalidates in the background.
 */
export function cdnShort(sMaxAge = 60, swr = 300): string {
  return `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`
}

/**
 * Header for rarely-changing public reference data, cacheable both by the
 * browser and shared/CDN layers with a long stale-while-revalidate window.
 */
export function staticShared(sMaxAge = 300, swr = 86400): string {
  return `public, max-age=${sMaxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`
}
