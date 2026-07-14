/**
 * Validation + overlap guards for host availability blocks. Complements
 * `unavailableRent.cache.test.ts` (which only asserts cache invalidation).
 * Covers the date/title guards, the reservation & block overlap conflicts, and
 * the read/formatting helpers. Prisma + Redis mocked at the boundary.
 */
const prismaMock = {
  rent: { findMany: jest.fn() },
  unAvailableProduct: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))
jest.mock('@/lib/cache/redis-cache.service', () => ({
  availabilityCacheService: { invalidateAvailability: jest.fn().mockResolvedValue(undefined) },
}))

import {
  createUnavailableRent,
  updateUnavailableRent,
  deleteUnavailableRent,
  findUnavailableByProductId,
  findUnavailableByHostId,
} from '../unavailableRent.service'

// Dates safely in the future so the "not before today" guard passes.
const START = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
const END = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('createUnavailableRent — input guards', () => {
  it('rejects a start date before today', async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000)

    await expect(createUnavailableRent('p1', past, END, 'Maintenance')).rejects.toThrow(
      /antérieure à aujourd'hui/
    )
    expect(prismaMock.unAvailableProduct.create).not.toHaveBeenCalled()
  })

  it('rejects when the end date is before the start date', async () => {
    await expect(createUnavailableRent('p1', END, START, 'Maintenance')).rejects.toThrow(
      /date de fin/
    )
  })

  it('rejects a blank title', async () => {
    await expect(createUnavailableRent('p1', START, END, '   ')).rejects.toThrow(/titre/)
  })

  it('rejects when a reservation overlaps the block', async () => {
    prismaMock.rent.findMany.mockResolvedValue([{ id: 'r1' }])

    await expect(createUnavailableRent('p1', START, END, 'Maintenance')).rejects.toThrow(
      /réservations sur cette période/
    )
    expect(prismaMock.unAvailableProduct.create).not.toHaveBeenCalled()
  })

  it('rejects when another block overlaps the requested period', async () => {
    prismaMock.rent.findMany.mockResolvedValue([])
    prismaMock.unAvailableProduct.findMany.mockResolvedValue([{ id: 'b0' }])

    await expect(createUnavailableRent('p1', START, END, 'Maintenance')).rejects.toThrow(
      /indisponibilité sur ces dates/
    )
  })

  it('creates the block (trimmed title/description) when no conflict', async () => {
    prismaMock.rent.findMany.mockResolvedValue([])
    prismaMock.unAvailableProduct.findMany.mockResolvedValue([])
    prismaMock.unAvailableProduct.create.mockResolvedValue({ id: 'b1', productId: 'p1' })

    const result = await createUnavailableRent('p1', START, END, '  Painting  ', '  desc  ')

    expect(result).toEqual({ id: 'b1', productId: 'p1' })
    const data = prismaMock.unAvailableProduct.create.mock.calls[0][0].data
    expect(data.title).toBe('Painting')
    expect(data.description).toBe('desc')
    expect(data.product).toEqual({ connect: { id: 'p1' } })
  })
})

describe('updateUnavailableRent', () => {
  it('throws when the block does not exist', async () => {
    prismaMock.unAvailableProduct.findUnique.mockResolvedValue(null)

    await expect(updateUnavailableRent('missing', { title: 'x' })).rejects.toThrow(
      /Indisponibilité non trouvée/
    )
  })

  it('rejects a blank title on update', async () => {
    prismaMock.unAvailableProduct.findUnique.mockResolvedValue({
      id: 'b1',
      productId: 'p1',
      startDate: START,
      endDate: END,
    })

    await expect(updateUnavailableRent('b1', { title: '  ' })).rejects.toThrow(/titre/)
  })

  it('excludes the current block from the overlap check', async () => {
    prismaMock.unAvailableProduct.findUnique.mockResolvedValue({
      id: 'b1',
      productId: 'p1',
      startDate: START,
      endDate: END,
    })
    prismaMock.rent.findMany.mockResolvedValue([])
    prismaMock.unAvailableProduct.findMany.mockResolvedValue([])
    prismaMock.unAvailableProduct.update.mockResolvedValue({ id: 'b1', productId: 'p1' })

    await updateUnavailableRent('b1', { title: 'Updated' })

    const where = prismaMock.unAvailableProduct.findMany.mock.calls[0][0].where
    expect(where.id).toEqual({ not: 'b1' })
  })
})

describe('deleteUnavailableRent', () => {
  it('throws when the block does not exist', async () => {
    prismaMock.unAvailableProduct.findUnique.mockResolvedValue(null)

    await expect(deleteUnavailableRent('missing')).rejects.toThrow(/Indisponibilité non trouvée/)
    expect(prismaMock.unAvailableProduct.delete).not.toHaveBeenCalled()
  })

  it('deletes and returns success', async () => {
    prismaMock.unAvailableProduct.findUnique.mockResolvedValue({ id: 'b1', productId: 'p1' })
    prismaMock.unAvailableProduct.delete.mockResolvedValue({ id: 'b1' })

    expect(await deleteUnavailableRent('b1')).toEqual({ success: true })
  })
})

describe('read helpers', () => {
  it('findUnavailableByProductId formats dates as YYYY-MM-DD', async () => {
    prismaMock.unAvailableProduct.findMany.mockResolvedValue([
      {
        id: 'b1',
        title: 'Maintenance',
        description: null,
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        endDate: new Date('2026-08-03T00:00:00.000Z'),
        productId: 'p1',
      },
    ])

    const result = await findUnavailableByProductId('p1')

    expect(result[0]).toEqual({
      id: 'b1',
      title: 'Maintenance',
      description: null,
      start: '2026-08-01',
      end: '2026-08-03',
      productId: 'p1',
      type: 'unavailability',
    })
  })

  it('findUnavailableByHostId includes the property name', async () => {
    prismaMock.unAvailableProduct.findMany.mockResolvedValue([
      {
        id: 'b1',
        title: 'Closed',
        description: 'holiday',
        startDate: new Date('2026-09-10T00:00:00.000Z'),
        endDate: new Date('2026-09-12T00:00:00.000Z'),
        product: { id: 'p9', name: 'Villa' },
      },
    ])

    const result = await findUnavailableByHostId('host-1')

    expect(result[0]).toMatchObject({
      id: 'b1',
      productId: 'p9',
      propertyName: 'Villa',
      start: '2026-09-10',
      type: 'unavailability',
    })
  })
})
