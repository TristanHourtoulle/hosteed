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
