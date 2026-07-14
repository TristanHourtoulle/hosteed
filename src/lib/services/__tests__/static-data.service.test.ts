/**
 * Static-data services (meals, services, security, equipments) share the same
 * shape: thin Prisma CRUD wrappers that invalidate the static-data cache after a
 * write. This suite covers the read paths (findAll / findById), the happy-path
 * writes (asserting the cache is invalidated with the correct key), and the
 * error degradation contract.
 *
 * NOTE ON INVALIDATION FATALITY: meals/services/security wrap the cache call in
 * a best-effort `safeInvalidateStaticData` helper, so a cache failure does NOT
 * mask a committed write (covered here + in static-data-invalidation.nonfatal).
 * `equipments.service` was NOT given that wrapper: its invalidation runs inside
 * the write try-block, so a cache failure is (currently) fatal — the write is
 * mis-reported as `null`. The equipments tests below pin that *current*
 * behaviour; see the flagged bug in the task report.
 */

const prismaMock = {
  meals: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  services: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
  security: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  equipment: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
}

jest.mock('@/lib/prisma', () => ({ __esModule: true, default: prismaMock }))
jest.mock('@/lib/cache/invalidation', () => ({
  invalidateStaticDataCache: jest.fn().mockResolvedValue(undefined),
}))

import { invalidateStaticDataCache } from '@/lib/cache/invalidation'
import { findAllMeals, findMealById, createMeal, updateMeal, deleteMeal } from '../meals.service'
import { findAllServices, findAllServicesForQuery, createService, deleteService } from '../services.service'
import {
  findAllSecurity,
  findSecurityById,
  createSecurity,
  updateSecurity,
  deleteSecurity,
} from '../security.services'
import {
  findAllEquipments,
  findEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipement,
} from '../equipments.service'

const invalidate = invalidateStaticDataCache as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  invalidate.mockResolvedValue(undefined)
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('meals.service', () => {
  it('findAllMeals returns rows', async () => {
    prismaMock.meals.findMany.mockResolvedValue([{ id: 'm1' }])
    expect(await findAllMeals()).toEqual([{ id: 'm1' }])
  })

  it('findAllMeals returns [] on error', async () => {
    prismaMock.meals.findMany.mockRejectedValue(new Error('db down'))
    expect(await findAllMeals()).toEqual([])
  })

  it('findMealById returns the row', async () => {
    prismaMock.meals.findFirst.mockResolvedValue({ id: 'm1' })
    expect(await findMealById('m1')).toEqual({ id: 'm1' })
  })

  it('createMeal persists and invalidates the "meals" cache key', async () => {
    prismaMock.meals.create.mockResolvedValue({ id: 'm1', name: 'Breakfast' })

    const result = await createMeal('Breakfast')

    expect(result).toEqual({ id: 'm1', name: 'Breakfast' })
    expect(invalidate).toHaveBeenCalledWith('meals')
  })

  it('updateMeal persists and invalidates the cache', async () => {
    prismaMock.meals.update.mockResolvedValue({ id: 'm1', name: 'Brunch' })

    const result = await updateMeal('m1', 'Brunch')

    expect(result).toEqual({ id: 'm1', name: 'Brunch' })
    expect(invalidate).toHaveBeenCalledWith('meals')
  })

  it('deleteMeal returns true and invalidates the cache', async () => {
    prismaMock.meals.delete.mockResolvedValue({ id: 'm1' })

    expect(await deleteMeal('m1')).toBe(true)
    expect(invalidate).toHaveBeenCalledWith('meals')
  })

  it('createMeal returns null when the write itself fails', async () => {
    prismaMock.meals.create.mockRejectedValue(new Error('db down'))
    expect(await createMeal('x')).toBeNull()
    expect(invalidate).not.toHaveBeenCalled()
  })
})

describe('services.service', () => {
  it('findAllServices returns rows ordered by name and no take by default', async () => {
    prismaMock.services.findMany.mockResolvedValue([{ id: 's1' }])

    await findAllServices()

    const arg = prismaMock.services.findMany.mock.calls[0][0]
    expect(arg.orderBy).toEqual({ name: 'asc' })
    expect(arg.take).toBeUndefined()
  })

  it('findAllServices applies a limit when provided', async () => {
    prismaMock.services.findMany.mockResolvedValue([])
    await findAllServices(3)
    expect(prismaMock.services.findMany.mock.calls[0][0].take).toBe(3)
  })

  it('findAllServicesForQuery delegates without a limit', async () => {
    prismaMock.services.findMany.mockResolvedValue([{ id: 's1' }])
    expect(await findAllServicesForQuery()).toEqual([{ id: 's1' }])
    expect(prismaMock.services.findMany.mock.calls[0][0].take).toBeUndefined()
  })

  it('createService invalidates the "services" cache key', async () => {
    prismaMock.services.create.mockResolvedValue({ id: 's1', name: 'Cleaning' })
    expect(await createService('Cleaning')).toEqual({ id: 's1', name: 'Cleaning' })
    expect(invalidate).toHaveBeenCalledWith('services')
  })

  it('deleteService returns true and invalidates the cache', async () => {
    prismaMock.services.delete.mockResolvedValue({ id: 's1' })
    expect(await deleteService('s1')).toBe(true)
    expect(invalidate).toHaveBeenCalledWith('services')
  })
})

describe('security.services', () => {
  it('findAllSecurity returns [] on error', async () => {
    prismaMock.security.findMany.mockRejectedValue(new Error('db down'))
    expect(await findAllSecurity()).toEqual([])
  })

  it('findSecurityById returns null on error', async () => {
    prismaMock.security.findFirst.mockRejectedValue(new Error('db down'))
    expect(await findSecurityById('s1')).toBeNull()
  })

  it('createSecurity invalidates the "security" cache key', async () => {
    prismaMock.security.create.mockResolvedValue({ id: 's1', name: 'Smoke detector' })
    expect(await createSecurity('Smoke detector')).toEqual({ id: 's1', name: 'Smoke detector' })
    expect(invalidate).toHaveBeenCalledWith('security')
  })

  it('updateSecurity invalidates the cache', async () => {
    prismaMock.security.update.mockResolvedValue({ id: 's1', name: 'CO detector' })
    expect(await updateSecurity('s1', 'CO detector')).toEqual({ id: 's1', name: 'CO detector' })
    expect(invalidate).toHaveBeenCalledWith('security')
  })

  it('deleteSecurity returns true and invalidates the cache', async () => {
    prismaMock.security.delete.mockResolvedValue({ id: 's1' })
    expect(await deleteSecurity('s1')).toBe(true)
    expect(invalidate).toHaveBeenCalledWith('security')
  })
})

describe('equipments.service', () => {
  it('findAllEquipments returns [] on error', async () => {
    prismaMock.equipment.findMany.mockRejectedValue(new Error('db down'))
    expect(await findAllEquipments()).toEqual([])
  })

  it('findEquipmentById returns the row', async () => {
    prismaMock.equipment.findFirst.mockResolvedValue({ id: 'e1' })
    expect(await findEquipmentById('e1')).toEqual({ id: 'e1' })
  })

  it('createEquipment persists (name + icon) and invalidates the "equipments" cache key', async () => {
    prismaMock.equipment.create.mockResolvedValue({ id: 'e1', name: 'Wifi', icon: 'wifi' })

    const result = await createEquipment('Wifi', 'wifi')

    expect(result).toEqual({ id: 'e1', name: 'Wifi', icon: 'wifi' })
    expect(prismaMock.equipment.create.mock.calls[0][0].data).toEqual({ name: 'Wifi', icon: 'wifi' })
    expect(invalidate).toHaveBeenCalledWith('equipments')
  })

  it('updateEquipment invalidates the cache', async () => {
    prismaMock.equipment.update.mockResolvedValue({ id: 'e1', name: 'AC', icon: 'ac' })
    expect(await updateEquipment('e1', 'AC', 'ac')).toEqual({ id: 'e1', name: 'AC', icon: 'ac' })
    expect(invalidate).toHaveBeenCalledWith('equipments')
  })

  it('deleteEquipement returns true and invalidates the cache', async () => {
    prismaMock.equipment.delete.mockResolvedValue({ id: 'e1' })
    expect(await deleteEquipement('e1')).toBe(true)
    expect(invalidate).toHaveBeenCalledWith('equipments')
  })

  // --- Divergence from meals/services/security (see file header + report) ---
  // equipments has no safeInvalidate wrapper, so a cache failure is fatal:
  // the committed write is mis-reported as null. Pinned as CURRENT behaviour.
  it('createEquipment returns null when cache invalidation throws (BUG: invalidation is fatal)', async () => {
    prismaMock.equipment.create.mockResolvedValue({ id: 'e1', name: 'Wifi', icon: 'wifi' })
    invalidate.mockRejectedValueOnce(new Error('redis down'))

    expect(await createEquipment('Wifi', 'wifi')).toBeNull()
  })

  it('updateEquipment returns null when cache invalidation throws (BUG: invalidation is fatal)', async () => {
    prismaMock.equipment.update.mockResolvedValue({ id: 'e1', name: 'AC', icon: 'ac' })
    invalidate.mockRejectedValueOnce(new Error('redis down'))

    expect(await updateEquipment('e1', 'AC', 'ac')).toBeNull()
  })

  it('deleteEquipement returns null when cache invalidation throws (BUG: invalidation is fatal)', async () => {
    prismaMock.equipment.delete.mockResolvedValue({ id: 'e1' })
    invalidate.mockRejectedValueOnce(new Error('redis down'))

    expect(await deleteEquipement('e1')).toBeNull()
  })
})
