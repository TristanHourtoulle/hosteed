/**
 * Regression guard (code-review, TRI-1016): static-data cache invalidation is
 * best-effort and MUST NOT be fatal to a successful DB write. If invalidation
 * throws, the create/update/delete must still report success (return the
 * created/updated entity, not null) so an admin is never told a committed write
 * "failed" and retries into a duplicate row.
 */

type MutationMock = {
  create: jest.Mock
  update: jest.Mock
  delete: jest.Mock
}

const prismaMock: {
  meals: MutationMock
  security: MutationMock
  services: Pick<MutationMock, 'create' | 'delete'>
} = {
  meals: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  security: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  services: { create: jest.fn(), delete: jest.fn() },
}

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))
jest.mock('@/lib/cache/invalidation', () => ({
  invalidateStaticDataCache: jest.fn().mockResolvedValue(undefined),
}))

import { invalidateStaticDataCache } from '@/lib/cache/invalidation'
import { createMeal, updateMeal, deleteMeal } from '../meals.service'
import { createSecurity, updateSecurity, deleteSecurity } from '../security.services'
import { createService, deleteService } from '../services.service'

const invalidate = invalidateStaticDataCache as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  invalidate.mockResolvedValue(undefined)
  // Silence the expected best-effort error log without asserting on stderr.
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('meals.service — invalidation is non-fatal to the write', () => {
  it('createMeal returns the created entity even if cache invalidation throws', async () => {
    const created = { id: 'm1', name: 'Breakfast' }
    prismaMock.meals.create.mockResolvedValue(created)
    invalidate.mockRejectedValueOnce(new Error('redis down'))

    const result = await createMeal('Breakfast')

    expect(result).toEqual(created)
    expect(invalidate).toHaveBeenCalledWith('meals')
  })

  it('updateMeal returns the updated entity even if cache invalidation throws', async () => {
    const updated = { id: 'm1', name: 'Brunch' }
    prismaMock.meals.update.mockResolvedValue(updated)
    invalidate.mockRejectedValueOnce(new Error('redis down'))

    const result = await updateMeal('m1', 'Brunch')

    expect(result).toEqual(updated)
  })

  it('deleteMeal returns true even if cache invalidation throws', async () => {
    prismaMock.meals.delete.mockResolvedValue({ id: 'm1', name: 'Breakfast' })
    invalidate.mockRejectedValueOnce(new Error('redis down'))

    const result = await deleteMeal('m1')

    expect(result).toBe(true)
  })
})

describe('security.services — invalidation is non-fatal to the write', () => {
  it('createSecurity returns the created entity even if cache invalidation throws', async () => {
    const created = { id: 's1', name: 'Smoke detector' }
    prismaMock.security.create.mockResolvedValue(created)
    invalidate.mockRejectedValueOnce(new Error('redis down'))

    const result = await createSecurity('Smoke detector')

    expect(result).toEqual(created)
    expect(invalidate).toHaveBeenCalledWith('security')
  })

  it('updateSecurity returns the updated entity even if cache invalidation throws', async () => {
    const updated = { id: 's1', name: 'CO detector' }
    prismaMock.security.update.mockResolvedValue(updated)
    invalidate.mockRejectedValueOnce(new Error('redis down'))

    const result = await updateSecurity('s1', 'CO detector')

    expect(result).toEqual(updated)
  })

  it('deleteSecurity returns true even if cache invalidation throws', async () => {
    prismaMock.security.delete.mockResolvedValue({ id: 's1', name: 'Smoke detector' })
    invalidate.mockRejectedValueOnce(new Error('redis down'))

    const result = await deleteSecurity('s1')

    expect(result).toBe(true)
  })
})

describe('services.service — invalidation is non-fatal to the write', () => {
  it('createService returns the created entity even if cache invalidation throws', async () => {
    const created = { id: 'sv1', name: 'Cleaning' }
    prismaMock.services.create.mockResolvedValue(created)
    invalidate.mockRejectedValueOnce(new Error('redis down'))

    const result = await createService('Cleaning')

    expect(result).toEqual(created)
    expect(invalidate).toHaveBeenCalledWith('services')
  })

  it('deleteService returns true even if cache invalidation throws', async () => {
    prismaMock.services.delete.mockResolvedValue({ id: 'sv1', name: 'Cleaning' })
    invalidate.mockRejectedValueOnce(new Error('redis down'))

    const result = await deleteService('sv1')

    expect(result).toBe(true)
  })
})
