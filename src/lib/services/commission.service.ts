'use server'
import prisma from '@/lib/prisma'

export interface CommissionCalculation {
  basePrice: number
  hostCommission: number
  clientCommission: number
  totalPrice: number
  hostReceives: number
  clientPays: number
  breakdown: {
    hostCommissionRate: number
    hostCommissionFixed: number
    clientCommissionRate: number
    clientCommissionFixed: number
  }
}

interface CommissionSettings {
  hostCommissionRate: number
  hostCommissionFixed: number
  clientCommissionRate: number
  clientCommissionFixed: number
}

// Cache for legacy global commission settings
let cachedCommissionSettings: CommissionSettings | null = null
let cacheTimestamp: number = 0

// Cache for per-type commissions (Map<typeId, {settings, timestamp}>)
const typeCommissionCache = new Map<string, { settings: CommissionSettings; timestamp: number }>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get commission settings for a specific property type
 * @param typeId - The property type ID
 * @returns Commission settings for the specified type
 */
async function getCommissionByTypeId(typeId: string): Promise<CommissionSettings> {
  const now = Date.now()

  // Check cache first
  const cached = typeCommissionCache.get(typeId)
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.settings
  }

  try {
    // Query the new Commission model by typeId
    const commission = await prisma.commission.findUnique({
      where: {
        typeRentId: typeId,
        isActive: true,
      },
    })

    let settings: CommissionSettings

    if (!commission) {
      console.warn(`No commission found for typeId: ${typeId}, falling back to global settings`)
      // Fallback to global settings if no commission found for this type
      settings = await getCommissionSettings()
    } else {
      settings = {
        hostCommissionRate: Number(commission.hostCommissionRate) || 0,
        hostCommissionFixed: Number(commission.hostCommissionFixed) || 0,
        clientCommissionRate: Number(commission.clientCommissionRate) || 0,
        clientCommissionFixed: Number(commission.clientCommissionFixed) || 0,
      }
    }

    // Cache the result
    typeCommissionCache.set(typeId, { settings, timestamp: now })
    return settings
  } catch (error) {
    console.error(`Error fetching commission for typeId ${typeId}:`, error)
    // Fallback to global settings on error
    return await getCommissionSettings()
  }
}

/**
 * Get global commission settings (LEGACY - for backward compatibility)
 * @deprecated Use getCommissionByTypeId instead
 */
async function getCommissionSettings(): Promise<CommissionSettings> {
  const now = Date.now()

  if (cachedCommissionSettings && now - cacheTimestamp < CACHE_DURATION) {
    return cachedCommissionSettings
  }

  try {
    const settings = await prisma.commissionSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!settings) {
      cachedCommissionSettings = {
        hostCommissionRate: 0.0,
        hostCommissionFixed: 0.0,
        clientCommissionRate: 0.0,
        clientCommissionFixed: 0.0,
      }
    } else {
      cachedCommissionSettings = {
        hostCommissionRate: Number(settings.hostCommissionRate) || 0,
        hostCommissionFixed: Number(settings.hostCommissionFixed) || 0,
        clientCommissionRate: Number(settings.clientCommissionRate) || 0,
        clientCommissionFixed: Number(settings.clientCommissionFixed) || 0,
      }
    }

    cacheTimestamp = now
    return cachedCommissionSettings
  } catch (error) {
    console.error('Error fetching commission settings:', error)
    return {
      hostCommissionRate: 0.0,
      hostCommissionFixed: 0.0,
      clientCommissionRate: 0.0,
      clientCommissionFixed: 0.0,
    }
  }
}

/**
 * Calculate commissions for a booking
 * @param basePrice - The base price before commissions
 * @param typeId - Optional property type ID for type-specific commissions
 * @returns Complete commission calculation breakdown
 */
export async function calculateCommissions(
  basePrice: number,
  typeId?: string
): Promise<CommissionCalculation> {
  // Use type-specific commission if typeId provided, otherwise fallback to global
  const settings = typeId ? await getCommissionByTypeId(typeId) : await getCommissionSettings()

  const hostCommissionRate = settings.hostCommissionRate || 0
  const hostCommissionFixed = settings.hostCommissionFixed || 0
  const clientCommissionRate = settings.clientCommissionRate || 0
  const clientCommissionFixed = settings.clientCommissionFixed || 0

  const hostCommission = basePrice * hostCommissionRate + hostCommissionFixed
  const clientCommission = basePrice * clientCommissionRate + clientCommissionFixed

  const hostReceives = basePrice - hostCommission
  const clientPays = basePrice + clientCommission
  const totalPrice = clientPays

  return {
    basePrice,
    hostCommission,
    clientCommission,
    totalPrice,
    hostReceives,
    clientPays,
    breakdown: {
      hostCommissionRate,
      hostCommissionFixed,
      clientCommissionRate,
      clientCommissionFixed,
    },
  }
}

/**
 * Calculate total rent price including commissions for multi-night stays
 * @param basePrice - The base nightly price
 * @param numberOfNights - Number of nights
 * @param additionalFees - Optional additional fees (cleaning, extras, etc.)
 * @param typeId - Optional property type ID for type-specific commissions
 * @returns Complete commission calculation breakdown
 */
export async function calculateTotalRentPrice(
  basePrice: number,
  numberOfNights: number,
  additionalFees?: number,
  typeId?: string
): Promise<CommissionCalculation> {
  const totalBasePrice = basePrice * numberOfNights + (additionalFees || 0)
  return await calculateCommissions(totalBasePrice, typeId)
}

export async function formatCommissionBreakdown(calculation: CommissionCalculation) {
  return {
    basePrice: `${calculation.basePrice.toFixed(2)}€`,
    hostCommission: `${calculation.hostCommission.toFixed(2)}€`,
    clientCommission: `${calculation.clientCommission.toFixed(2)}€`,
    hostReceives: `${calculation.hostReceives.toFixed(2)}€`,
    clientPays: `${calculation.clientPays.toFixed(2)}€`,
    hostCommissionPercentage: `${(calculation.breakdown.hostCommissionRate * 100).toFixed(2)}%`,
    clientCommissionPercentage: `${(calculation.breakdown.clientCommissionRate * 100).toFixed(2)}%`,
  }
}

/**
 * Invalidate all commission caches (both global and per-type)
 * Call this after creating/updating commission settings
 */
export async function invalidateCommissionCache() {
  cachedCommissionSettings = null
  cacheTimestamp = 0
  typeCommissionCache.clear()
}

/**
 * Invalidate cache for a specific property type
 * @param typeId - The property type ID
 */
export async function invalidateTypeCommissionCache(typeId: string) {
  typeCommissionCache.delete(typeId)
}
