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

let cachedCommissionSettings: {
  hostCommissionRate: number
  hostCommissionFixed: number
  clientCommissionRate: number
  clientCommissionFixed: number
} | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function getCommissionSettings() {
  const now = Date.now()

  if (cachedCommissionSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedCommissionSettings
  }

  try {
    const settings = await prisma.commissionSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
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

export async function calculateCommissions(basePrice: number): Promise<CommissionCalculation> {
  const settings = await getCommissionSettings()

  const hostCommissionRate = settings.hostCommissionRate || 0
  const hostCommissionFixed = settings.hostCommissionFixed || 0
  const clientCommissionRate = settings.clientCommissionRate || 0
  const clientCommissionFixed = settings.clientCommissionFixed || 0

  const hostCommission = (basePrice * hostCommissionRate) + hostCommissionFixed
  const clientCommission = (basePrice * clientCommissionRate) + clientCommissionFixed

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
    }
  }
}

export async function calculateTotalRentPrice(
  basePrice: number,
  numberOfNights: number,
  additionalFees?: number
): Promise<CommissionCalculation> {
  const totalBasePrice = (basePrice * numberOfNights) + (additionalFees || 0)
  return await calculateCommissions(totalBasePrice)
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

export async function invalidateCommissionCache() {
  cachedCommissionSettings = null
  cacheTimestamp = 0
}
