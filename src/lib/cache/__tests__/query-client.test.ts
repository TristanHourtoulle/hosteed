import { CACHE_TAGS } from '../query-client'

/**
 * Guards the centralized query-key factory entries added for TRI-1015.
 * Each factory must return the exact key array that the hooks previously
 * inlined, so cache identity is unchanged after centralization.
 */
describe('CACHE_TAGS factory (TRI-1015 centralized keys)', () => {
  it('hostProducts returns the paginated host-products key', () => {
    expect(CACHE_TAGS.hostProducts(2, 20)).toEqual(['host-products', 2, 20])
  })

  it('rentStatistics returns the rent-statistics key for a user', () => {
    expect(CACHE_TAGS.rentStatistics('user-1')).toEqual(['rent-statistics', 'user-1'])
  })

  it('rentStatistics preserves an undefined userId (unchanged cache identity)', () => {
    expect(CACHE_TAGS.rentStatistics(undefined)).toEqual(['rent-statistics', undefined])
  })

  it('productsSearch wraps the backend search params object', () => {
    const params = { page: 1, limit: 20, search: 'villa' }
    expect(CACHE_TAGS.productsSearch(params)).toEqual(['products-search', params])
  })

  it('roomTypeAvailability returns the product/arrival/leaving key', () => {
    expect(CACHE_TAGS.roomTypeAvailability('p1', '2026-01-01', '2026-01-05')).toEqual([
      'room-type-availability',
      'p1',
      '2026-01-01',
      '2026-01-05',
    ])
  })

  it('bookingPricing returns the full booking-pricing key', () => {
    expect(
      CACHE_TAGS.bookingPricing('p1', '2026-01-01', '2026-01-05', 2, 30, 'owner-1')
    ).toEqual(['booking-pricing', 'p1', '2026-01-01', '2026-01-05', 2, 30, 'owner-1'])
  })

  it('hotelPricing returns the full hotel-booking-pricing key', () => {
    expect(
      CACHE_TAGS.hotelPricing('p1', 'enc-sel', '2026-01-01', '2026-01-05', 3)
    ).toEqual(['hotel-booking-pricing', 'p1', 'enc-sel', '2026-01-01', '2026-01-05', 3])
  })

  it('bulkFavorites spreads product ids after the user id', () => {
    expect(CACHE_TAGS.bulkFavorites('user-1', ['a', 'b'])).toEqual([
      'bulk-favorites',
      'user-1',
      'a',
      'b',
    ])
  })
})

/**
 * Guards the page-migration query-key factories added for TRI-1017. Later
 * migrations reference these instead of inlining key arrays, so their shapes
 * must stay stable.
 */
describe('CACHE_TAGS factory (TRI-1017 page-migration keys)', () => {
  it('hostPromotions scopes promotions by host id', () => {
    expect(CACHE_TAGS.hostPromotions('host-1')).toEqual(['host', 'promotions', 'host-1'])
  })

  it('hostProductsList returns the shared /api/host/products key', () => {
    expect(CACHE_TAGS.hostProductsList()).toEqual(['host', 'products', 'list'])
  })

  it('hostUnavailability defaults to "all" when no product id is given', () => {
    expect(CACHE_TAGS.hostUnavailability()).toEqual(['host', 'unavailability', 'all'])
    expect(CACHE_TAGS.hostUnavailability('p-9')).toEqual(['host', 'unavailability', 'p-9'])
  })

  it('adminProducts wraps optional query params (null when omitted)', () => {
    expect(CACHE_TAGS.adminProducts()).toEqual(['admin', 'products', null])
    expect(CACHE_TAGS.adminProducts({ page: 1, limit: 50 })).toEqual([
      'admin',
      'products',
      { page: 1, limit: 50 },
    ])
  })

  it('adminBlog and adminBlogPost return list and detail keys', () => {
    expect(CACHE_TAGS.adminBlog()).toEqual(['admin', 'blog'])
    expect(CACHE_TAGS.adminBlogPost('post-3')).toEqual(['admin', 'blog', 'post-3'])
  })

  it('adminUsers, adminUser and adminUnverifiedUsers stay distinct', () => {
    expect(CACHE_TAGS.adminUsers()).toEqual(['admin', 'users'])
    expect(CACHE_TAGS.adminUser('u-1')).toEqual(['admin', 'users', 'u-1'])
    expect(CACHE_TAGS.adminUnverifiedUsers()).toEqual(['admin', 'users', 'unverified'])
  })

  it('adminHostBalance scopes the balance by host id', () => {
    expect(CACHE_TAGS.adminHostBalance('host-7')).toEqual([
      'admin',
      'withdrawals',
      'balance',
      'host-7',
    ])
  })

  it('adminTypeRentProducts nests products under the type id', () => {
    expect(CACHE_TAGS.adminTypeRentProducts('t-2')).toEqual(['admin', 'typeRent', 't-2', 'products'])
  })

  it('exposes the flat admin list keys used by CRUD pages', () => {
    expect(CACHE_TAGS.adminExtras()).toEqual(['admin', 'extras'])
    expect(CACHE_TAGS.adminHighlights()).toEqual(['admin', 'highlights'])
    expect(CACHE_TAGS.adminIncludedServices()).toEqual(['admin', 'included-services'])
    expect(CACHE_TAGS.adminReviews()).toEqual(['admin', 'reviews'])
    expect(CACHE_TAGS.adminCommissions()).toEqual(['admin', 'commissions'])
    expect(CACHE_TAGS.adminCommissionSettings()).toEqual(['admin', 'commission-settings'])
    expect(CACHE_TAGS.adminHomepage()).toEqual(['admin', 'homepage'])
    expect(CACHE_TAGS.adminUserRatings()).toEqual(['admin', 'user-ratings'])
    expect(CACHE_TAGS.adminPromotions()).toEqual(['admin', 'promotions'])
    expect(CACHE_TAGS.adminWithdrawals()).toEqual(['admin', 'withdrawals'])
    expect(CACHE_TAGS.adminHosts()).toEqual(['admin', 'hosts'])
  })
})
