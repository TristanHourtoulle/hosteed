/**
 * Commission management (per-property-type CRUD). Prisma and the per-type cache
 * invalidation are mocked at the boundary (node env). We assert the duplicate
 * guards, type-existence checks, cache invalidation calls, and error wrapping.
 */

const commission = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}
const typeRentFindUnique = jest.fn()
const typeRentFindMany = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    commission,
    typeRent: {
      findUnique: (...a: unknown[]) => typeRentFindUnique(...a),
      findMany: (...a: unknown[]) => typeRentFindMany(...a),
    },
  },
}))

const invalidateTypeCommissionCache = jest.fn()
jest.mock('../commission.service', () => ({
  invalidateTypeCommissionCache: (...a: unknown[]) => invalidateTypeCommissionCache(...a),
}))

import {
  getAllCommissions,
  getCommissionById,
  getCommissionByTypeId,
  createCommission,
  updateCommission,
  deleteCommission,
  getPropertyTypesWithoutCommissions,
  toggleCommissionStatus,
} from '../commission-management.service'

const validData = {
  title: 'Std',
  hostCommissionRate: 0.1,
  hostCommissionFixed: 0,
  clientCommissionRate: 0.05,
  clientCommissionFixed: 0,
  typeRentId: 'type-1',
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

describe('getAllCommissions', () => {
  it('returns commissions ordered by createdAt desc', async () => {
    commission.findMany.mockResolvedValue([{ id: 'c1' }])
    const result = await getAllCommissions()
    expect(result).toEqual([{ id: 'c1' }])
    expect(commission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    )
  })

  it('wraps DB errors in a friendly message', async () => {
    commission.findMany.mockRejectedValue(new Error('boom'))
    await expect(getAllCommissions()).rejects.toThrow('Failed to fetch commissions')
  })
})

describe('getCommissionById / getCommissionByTypeId', () => {
  it('returns the commission by id', async () => {
    commission.findUnique.mockResolvedValue({ id: 'c1' })
    expect(await getCommissionById('c1')).toEqual({ id: 'c1' })
  })

  it('returns the commission by typeId', async () => {
    commission.findUnique.mockResolvedValue({ id: 'c1' })
    await getCommissionByTypeId('type-1')
    expect(commission.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { typeRentId: 'type-1' } })
    )
  })
})

describe('createCommission', () => {
  it('creates a commission and invalidates the type cache', async () => {
    commission.findUnique.mockResolvedValue(null)
    typeRentFindUnique.mockResolvedValue({ id: 'type-1' })
    commission.create.mockResolvedValue({ id: 'c1', typeRentId: 'type-1' })

    const result = await createCommission(validData)

    expect(result).toEqual({ id: 'c1', typeRentId: 'type-1' })
    expect(commission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ typeRentId: 'type-1', isActive: true }),
      })
    )
    expect(invalidateTypeCommissionCache).toHaveBeenCalledWith('type-1')
  })

  it('rejects when a commission already exists for the type', async () => {
    commission.findUnique.mockResolvedValue({ id: 'existing' })
    await expect(createCommission(validData)).rejects.toThrow(
      'A commission already exists for this property type'
    )
    expect(commission.create).not.toHaveBeenCalled()
  })

  it('rejects when the property type does not exist', async () => {
    commission.findUnique.mockResolvedValue(null)
    typeRentFindUnique.mockResolvedValue(null)
    await expect(createCommission(validData)).rejects.toThrow('Property type not found')
  })

  it('defaults isActive to true when not provided', async () => {
    commission.findUnique.mockResolvedValue(null)
    typeRentFindUnique.mockResolvedValue({ id: 'type-1' })
    commission.create.mockResolvedValue({ id: 'c1', typeRentId: 'type-1' })

    await createCommission(validData)
    const data = commission.create.mock.calls[0][0].data
    expect(data.isActive).toBe(true)
  })
})

describe('updateCommission', () => {
  it('updates and invalidates the existing type cache', async () => {
    commission.findUnique.mockResolvedValue({ id: 'c1', typeRentId: 'type-1' })
    commission.update.mockResolvedValue({ id: 'c1', typeRentId: 'type-1' })

    await updateCommission('c1', { title: 'New' })

    expect(commission.update).toHaveBeenCalled()
    expect(invalidateTypeCommissionCache).toHaveBeenCalledWith('type-1')
  })

  it('rejects when the commission does not exist', async () => {
    commission.findUnique.mockResolvedValue(null)
    await expect(updateCommission('missing', {})).rejects.toThrow('Commission not found')
  })

  it('rejects when moving to a type that already has a commission', async () => {
    // 1st findUnique: the existing row. 2nd: the conflicting target type.
    commission.findUnique
      .mockResolvedValueOnce({ id: 'c1', typeRentId: 'type-1' })
      .mockResolvedValueOnce({ id: 'c2', typeRentId: 'type-2' })

    await expect(updateCommission('c1', { typeRentId: 'type-2' })).rejects.toThrow(
      'A commission already exists for the target property type'
    )
  })

  it('invalidates both old and new type caches on a type change', async () => {
    commission.findUnique
      .mockResolvedValueOnce({ id: 'c1', typeRentId: 'type-1' })
      .mockResolvedValueOnce(null) // no conflict
    commission.update.mockResolvedValue({ id: 'c1', typeRentId: 'type-2' })

    await updateCommission('c1', { typeRentId: 'type-2' })

    expect(invalidateTypeCommissionCache).toHaveBeenCalledWith('type-1')
    expect(invalidateTypeCommissionCache).toHaveBeenCalledWith('type-2')
  })
})

describe('deleteCommission', () => {
  it('deletes and invalidates the type cache', async () => {
    commission.findUnique.mockResolvedValue({ id: 'c1', typeRentId: 'type-1' })
    commission.delete.mockResolvedValue({})

    await deleteCommission('c1')

    expect(commission.delete).toHaveBeenCalledWith({ where: { id: 'c1' } })
    expect(invalidateTypeCommissionCache).toHaveBeenCalledWith('type-1')
  })

  it('rejects when the commission does not exist', async () => {
    commission.findUnique.mockResolvedValue(null)
    await expect(deleteCommission('missing')).rejects.toThrow('Commission not found')
    expect(commission.delete).not.toHaveBeenCalled()
  })
})

describe('getPropertyTypesWithoutCommissions', () => {
  it('returns only types that have no commission', async () => {
    typeRentFindMany.mockResolvedValue([
      { id: 't1', name: 'A', description: 'a', commission: null },
      { id: 't2', name: 'B', description: 'b', commission: { id: 'c1' } },
    ])

    const result = await getPropertyTypesWithoutCommissions()

    expect(result).toEqual([{ id: 't1', name: 'A', description: 'a' }])
  })
})

describe('toggleCommissionStatus', () => {
  it('flips isActive and invalidates the type cache', async () => {
    commission.findUnique.mockResolvedValue({ id: 'c1', typeRentId: 'type-1', isActive: true })
    commission.update.mockResolvedValue({ id: 'c1', typeRentId: 'type-1', isActive: false })

    await toggleCommissionStatus('c1')

    expect(commission.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    )
    expect(invalidateTypeCommissionCache).toHaveBeenCalledWith('type-1')
  })

  it('rejects when the commission does not exist', async () => {
    commission.findUnique.mockResolvedValue(null)
    await expect(toggleCommissionStatus('missing')).rejects.toThrow('Commission not found')
  })
})
