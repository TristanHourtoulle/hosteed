import { invalidateClientCache } from '../client-invalidation'
import { queryClient, CACHE_TAGS } from '../query-client'

/**
 * Guards the expanded product invalidation family for TRI-1015.
 * `invalidateClientCache.products(id)` must invalidate the whole product
 * family: products, products-search, product(id) and host-products.
 */
describe('invalidateClientCache.products (TRI-1015 full family)', () => {
  const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

  beforeEach(() => {
    invalidateSpy.mockReset()
    invalidateSpy.mockResolvedValue(undefined)
  })

  afterAll(() => {
    invalidateSpy.mockRestore()
  })

  const invalidatedKeys = () =>
    invalidateSpy.mock.calls.map(call => call[0]?.queryKey)

  it('invalidates products, products-search and host-products without an id', async () => {
    await invalidateClientCache.products()

    const keys = invalidatedKeys()
    expect(keys).toContainEqual(CACHE_TAGS.products)
    expect(keys).toContainEqual(['products-search'])
    expect(keys).toContainEqual(['host-products'])
  })

  it('also invalidates the specific product when an id is provided', async () => {
    await invalidateClientCache.products('prod-42')

    const keys = invalidatedKeys()
    expect(keys).toContainEqual(CACHE_TAGS.products)
    expect(keys).toContainEqual(['products-search'])
    expect(keys).toContainEqual(['host-products'])
    expect(keys).toContainEqual(CACHE_TAGS.product('prod-42'))
  })

  it('does not invalidate a specific product when no id is provided', async () => {
    await invalidateClientCache.products()

    const keys = invalidatedKeys()
    expect(keys).not.toContainEqual(['product', undefined])
  })
})
