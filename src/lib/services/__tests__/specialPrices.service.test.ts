/**
 * Special-prices CRUD service. Prisma + product-cache invalidation are mocked at
 * the boundary (node env). Each mutation must invalidate the product cache; each
 * operation swallows errors and returns null.
 */

const specialPrices = {
  create: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}
const invalidateProductCache = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: { specialPrices },
}))

jest.mock('@/lib/cache/invalidation', () => ({
  invalidateProductCache: (...a: unknown[]) => invalidateProductCache(...a),
}))

import {
  createSpecialPrices,
  findSpecialsPricesByProduct,
  updateSpecialPrices,
  toggleSpecialPriceStatus,
  deleteSpecialsPricesByProduct,
} from '../specialPrices.service'

const days = ['Monday', 'Tuesday'] as never // DayEnum[] at runtime is just strings

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

describe('createSpecialPrices', () => {
  it('creates a special price and invalidates the product cache', async () => {
    specialPrices.create.mockResolvedValue({ id: 'sp1', productId: 'p1' })

    const result = await createSpecialPrices('40000', '100', days, null, null, true, 'p1')

    expect(result).toEqual({ id: 'sp1', productId: 'p1' })
    expect(specialPrices.create).toHaveBeenCalledWith({
      data: {
        pricesMga: '40000',
        pricesEuro: '100',
        day: days,
        startDate: null,
        endDate: null,
        activate: true,
        productId: 'p1',
      },
    })
    expect(invalidateProductCache).toHaveBeenCalledWith('p1')
  })

  it('persists the provided date range', async () => {
    specialPrices.create.mockResolvedValue({ id: 'sp1', productId: 'p1' })
    const s = new Date('2026-07-01')
    const e = new Date('2026-07-31')

    await createSpecialPrices('40000', '100', days, s, e, true, 'p1')

    const data = specialPrices.create.mock.calls[0][0].data
    expect(data.startDate).toBe(s)
    expect(data.endDate).toBe(e)
  })

  it('returns null and does not invalidate on error', async () => {
    specialPrices.create.mockRejectedValue(new Error('db down'))

    const result = await createSpecialPrices('40000', '100', days, null, null, true, 'p1')

    expect(result).toBeNull()
    expect(invalidateProductCache).not.toHaveBeenCalled()
  })
})

describe('findSpecialsPricesByProduct', () => {
  it('returns the special prices for a product', async () => {
    specialPrices.findMany.mockResolvedValue([{ id: 'sp1' }])
    const result = await findSpecialsPricesByProduct('p1')
    expect(result).toEqual([{ id: 'sp1' }])
    expect(specialPrices.findMany).toHaveBeenCalledWith({ where: { productId: 'p1' } })
  })

  it('returns null on error', async () => {
    specialPrices.findMany.mockRejectedValue(new Error('boom'))
    expect(await findSpecialsPricesByProduct('p1')).toBeNull()
  })
})

describe('updateSpecialPrices', () => {
  it('updates and invalidates using the returned productId', async () => {
    specialPrices.update.mockResolvedValue({ id: 'sp1', productId: 'p9' })

    const result = await updateSpecialPrices('sp1', '40000', '100', days, null, null, false)

    expect(result).toEqual({ id: 'sp1', productId: 'p9' })
    expect(invalidateProductCache).toHaveBeenCalledWith('p9')
  })

  it('returns null on error', async () => {
    specialPrices.update.mockRejectedValue(new Error('boom'))
    expect(await updateSpecialPrices('sp1', '1', '1', days, null, null, true)).toBeNull()
  })
})

describe('toggleSpecialPriceStatus', () => {
  it('updates only the activate flag and invalidates the cache', async () => {
    specialPrices.update.mockResolvedValue({ id: 'sp1', productId: 'p1' })

    await toggleSpecialPriceStatus('sp1', false)

    expect(specialPrices.update).toHaveBeenCalledWith({
      where: { id: 'sp1' },
      data: { activate: false },
    })
    expect(invalidateProductCache).toHaveBeenCalledWith('p1')
  })

  it('returns null on error', async () => {
    specialPrices.update.mockRejectedValue(new Error('boom'))
    expect(await toggleSpecialPriceStatus('sp1', true)).toBeNull()
  })
})

describe('deleteSpecialsPricesByProduct', () => {
  it('deletes and invalidates the product cache', async () => {
    specialPrices.delete.mockResolvedValue({ id: 'sp1', productId: 'p1' })

    await deleteSpecialsPricesByProduct('sp1')

    expect(specialPrices.delete).toHaveBeenCalledWith({ where: { id: 'sp1' } })
    expect(invalidateProductCache).toHaveBeenCalledWith('p1')
  })

  it('returns null on error', async () => {
    specialPrices.delete.mockRejectedValue(new Error('boom'))
    expect(await deleteSpecialsPricesByProduct('sp1')).toBeNull()
  })
})
