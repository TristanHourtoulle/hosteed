/**
 * Commission calculation service. Prisma is mocked at the boundary (node env).
 * These tests pin the money math, the per-type vs global settings resolution,
 * the in-memory caching, and the error/fallback behavior.
 */

const commissionFindUnique = jest.fn()
const commissionSettingsFindFirst = jest.fn()

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    commission: { findUnique: (...a: unknown[]) => commissionFindUnique(...a) },
    commissionSettings: { findFirst: (...a: unknown[]) => commissionSettingsFindFirst(...a) },
  },
}))

import {
  calculateCommissions,
  calculateTotalRentPrice,
  formatCommissionBreakdown,
  invalidateCommissionCache,
  invalidateTypeCommissionCache,
} from '../commission.service'

const globalSettings = {
  hostCommissionRate: 0.1,
  hostCommissionFixed: 5,
  clientCommissionRate: 0.05,
  clientCommissionFixed: 2,
  isActive: true,
}

beforeEach(async () => {
  jest.clearAllMocks()
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  commissionSettingsFindFirst.mockResolvedValue(globalSettings)
  // Reset module-level caches so tests don't leak state into each other.
  await invalidateCommissionCache()
})

describe('calculateCommissions (global settings)', () => {
  it('computes host/client commissions with rate + fixed', async () => {
    const result = await calculateCommissions(100)

    // host: 100 * 0.1 + 5 = 15 ; client: 100 * 0.05 + 2 = 7
    expect(result.hostCommission).toBe(15)
    expect(result.clientCommission).toBe(7)
    expect(result.hostReceives).toBe(85)
    expect(result.clientPays).toBe(107)
    expect(result.totalPrice).toBe(107)
    expect(result.basePrice).toBe(100)
    expect(result.breakdown).toEqual({
      hostCommissionRate: 0.1,
      hostCommissionFixed: 5,
      clientCommissionRate: 0.05,
      clientCommissionFixed: 2,
    })
  })

  it('returns zeroed commissions when no active settings exist', async () => {
    commissionSettingsFindFirst.mockResolvedValue(null)

    const result = await calculateCommissions(200)

    expect(result.hostCommission).toBe(0)
    expect(result.clientCommission).toBe(0)
    expect(result.hostReceives).toBe(200)
    expect(result.clientPays).toBe(200)
  })

  it('falls back to zeros when the settings query throws', async () => {
    commissionSettingsFindFirst.mockRejectedValue(new Error('db down'))

    const result = await calculateCommissions(50)

    expect(result.hostCommission).toBe(0)
    expect(result.clientCommission).toBe(0)
    expect(result.totalPrice).toBe(50)
  })

  it('caches global settings across calls (single DB read)', async () => {
    await calculateCommissions(100)
    await calculateCommissions(100)

    expect(commissionSettingsFindFirst).toHaveBeenCalledTimes(1)
  })
})

describe('calculateCommissions (per-type settings)', () => {
  it('resolves settings from the Commission row for the given typeId', async () => {
    commissionFindUnique.mockResolvedValue({
      hostCommissionRate: 0.2,
      hostCommissionFixed: 0,
      clientCommissionRate: 0,
      clientCommissionFixed: 0,
    })

    const result = await calculateCommissions(100, 'type-a')

    expect(commissionFindUnique).toHaveBeenCalled()
    // host: 100 * 0.2 = 20
    expect(result.hostCommission).toBe(20)
    expect(result.clientCommission).toBe(0)
    expect(commissionSettingsFindFirst).not.toHaveBeenCalled()
  })

  it('falls back to global settings when no commission row exists for the type', async () => {
    commissionFindUnique.mockResolvedValue(null)

    const result = await calculateCommissions(100, 'type-missing')

    // Global settings used → host 15, client 7
    expect(result.hostCommission).toBe(15)
    expect(commissionSettingsFindFirst).toHaveBeenCalled()
  })

  it('falls back to global settings when the per-type query throws', async () => {
    commissionFindUnique.mockRejectedValue(new Error('db down'))

    const result = await calculateCommissions(100, 'type-err')

    expect(result.hostCommission).toBe(15)
  })

  it('caches per-type settings across calls', async () => {
    commissionFindUnique.mockResolvedValue({
      hostCommissionRate: 0.2,
      hostCommissionFixed: 0,
      clientCommissionRate: 0,
      clientCommissionFixed: 0,
    })

    await calculateCommissions(100, 'type-a')
    await calculateCommissions(100, 'type-a')

    expect(commissionFindUnique).toHaveBeenCalledTimes(1)
  })

  it('invalidateTypeCommissionCache forces a re-query for that type', async () => {
    commissionFindUnique.mockResolvedValue({
      hostCommissionRate: 0.2,
      hostCommissionFixed: 0,
      clientCommissionRate: 0,
      clientCommissionFixed: 0,
    })

    await calculateCommissions(100, 'type-a')
    await invalidateTypeCommissionCache('type-a')
    await calculateCommissions(100, 'type-a')

    expect(commissionFindUnique).toHaveBeenCalledTimes(2)
  })
})

describe('calculateTotalRentPrice', () => {
  it('multiplies the nightly base price by nights and adds fees before commissions', async () => {
    const result = await calculateTotalRentPrice(100, 3, 20)

    // totalBase = 100 * 3 + 20 = 320 ; host = 320 * 0.1 + 5 = 37
    expect(result.basePrice).toBe(320)
    expect(result.hostCommission).toBe(37)
  })

  it('treats additionalFees as optional (defaults to 0)', async () => {
    const result = await calculateTotalRentPrice(100, 2)

    expect(result.basePrice).toBe(200)
  })
})

describe('formatCommissionBreakdown', () => {
  it('formats currency and percentage strings', async () => {
    const calc = await calculateCommissions(100)
    const formatted = await formatCommissionBreakdown(calc)

    expect(formatted.basePrice).toBe('100.00€')
    expect(formatted.hostCommission).toBe('15.00€')
    expect(formatted.clientPays).toBe('107.00€')
    expect(formatted.hostCommissionPercentage).toBe('10.00%')
    expect(formatted.clientCommissionPercentage).toBe('5.00%')
  })
})
