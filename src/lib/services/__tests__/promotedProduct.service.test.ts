/**
 * promotedProduct.service manages the "sponsored product" slots. Coverage
 * focuses on the CRUD wrappers and the two date/exclusion-sensitive reads:
 * getActualProduct (only currently-active windows) and
 * getProductsAvailableForPromotion (approved products not already promoted).
 * Prisma is mocked at the boundary.
 */

const prismaMock = {
  promotedProduct: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))

import {
  createPromotedProduct,
  getActualProduct,
  getAllPromotedProducts,
  updatePromotedProduct,
  deletePromotedProduct,
  getProductsAvailableForPromotion,
  getPromotedProductByProductId,
} from '../promotedProduct.service'

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('createPromotedProduct', () => {
  it('connects the product and persists the promotion window', async () => {
    const start = new Date('2026-01-01')
    const end = new Date('2026-02-01')
    prismaMock.promotedProduct.create.mockResolvedValue({ id: 'pp1' })

    const result = await createPromotedProduct(true, start, end, 'p1')

    expect(result).toEqual({ id: 'pp1' })
    const data = prismaMock.promotedProduct.create.mock.calls[0][0].data
    expect(data).toMatchObject({ active: true, start, end })
    expect(data.product.connect.id).toBe('p1')
  })

  it('returns null when prisma throws', async () => {
    prismaMock.promotedProduct.create.mockRejectedValue(new Error('db down'))
    expect(await createPromotedProduct(true, new Date(), new Date(), 'p1')).toBeNull()
  })
})

describe('getActualProduct', () => {
  it('only queries active promotions whose window brackets now', async () => {
    prismaMock.promotedProduct.findMany.mockResolvedValue([{ id: 'pp1' }])

    await getActualProduct()

    const where = prismaMock.promotedProduct.findMany.mock.calls[0][0].where
    expect(where.active).toBe(true)
    expect(where.start.lte).toBeInstanceOf(Date)
    expect(where.end.gte).toBeInstanceOf(Date)
  })

  it('returns null when prisma throws', async () => {
    prismaMock.promotedProduct.findMany.mockRejectedValue(new Error('db down'))
    expect(await getActualProduct()).toBeNull()
  })
})

describe('getAllPromotedProducts', () => {
  it('returns all promotions ordered by start desc', async () => {
    prismaMock.promotedProduct.findMany.mockResolvedValue([{ id: 'pp1' }])

    const result = await getAllPromotedProducts()

    expect(result).toEqual([{ id: 'pp1' }])
    expect(prismaMock.promotedProduct.findMany.mock.calls[0][0].orderBy).toEqual({ start: 'desc' })
  })
})

describe('updatePromotedProduct', () => {
  it('updates the active flag and window', async () => {
    prismaMock.promotedProduct.update.mockResolvedValue({ id: 'pp1', active: false })

    const result = await updatePromotedProduct('pp1', false, new Date(), new Date())

    expect(result).toEqual({ id: 'pp1', active: false })
  })

  it('returns null on error', async () => {
    prismaMock.promotedProduct.update.mockRejectedValue(new Error('db down'))
    expect(await updatePromotedProduct('pp1', false, new Date(), new Date())).toBeNull()
  })
})

describe('deletePromotedProduct', () => {
  it('deletes by id', async () => {
    prismaMock.promotedProduct.delete.mockResolvedValue({ id: 'pp1' })
    expect(await deletePromotedProduct('pp1')).toEqual({ id: 'pp1' })
  })

  it('returns null on error', async () => {
    prismaMock.promotedProduct.delete.mockRejectedValue(new Error('db down'))
    expect(await deletePromotedProduct('pp1')).toBeNull()
  })
})

describe('getProductsAvailableForPromotion', () => {
  it('excludes products already in an active promotion window', async () => {
    prismaMock.promotedProduct.findMany.mockResolvedValue([
      { productId: 'p1' },
      { productId: 'p2' },
    ])
    prismaMock.product.findMany.mockResolvedValue([{ id: 'p3' }])

    const result = await getProductsAvailableForPromotion()

    expect(result).toEqual([{ id: 'p3' }])
    const where = prismaMock.product.findMany.mock.calls[0][0].where
    expect(where.validate).toBe('Approve')
    expect(where.id.notIn).toEqual(['p1', 'p2'])
  })

  it('returns null when prisma throws', async () => {
    prismaMock.promotedProduct.findMany.mockRejectedValue(new Error('db down'))
    expect(await getProductsAvailableForPromotion()).toBeNull()
  })
})

describe('getPromotedProductByProductId', () => {
  it('returns the most recent promotion for a product', async () => {
    prismaMock.promotedProduct.findFirst.mockResolvedValue({ id: 'pp1' })

    const result = await getPromotedProductByProductId('p1')

    expect(result).toEqual({ id: 'pp1' })
    expect(prismaMock.promotedProduct.findFirst.mock.calls[0][0].orderBy).toEqual({ start: 'desc' })
  })

  it('returns null on error', async () => {
    prismaMock.promotedProduct.findFirst.mockRejectedValue(new Error('db down'))
    expect(await getPromotedProductByProductId('p1')).toBeNull()
  })
})
