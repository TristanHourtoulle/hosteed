'use server'

import prisma from '@/lib/prisma'
import { invalidateTypeCommissionCache } from './commission.service'

/**
 * Commission Management Service
 * Handles CRUD operations for per-property-type commissions
 */

export interface CommissionData {
  title: string
  description?: string | null
  hostCommissionRate: number
  hostCommissionFixed: number
  clientCommissionRate: number
  clientCommissionFixed: number
  typeRentId: string
  isActive?: boolean
  createdBy?: string | null
}

export interface CommissionWithType {
  id: string
  title: string
  description: string | null
  hostCommissionRate: number
  hostCommissionFixed: number
  clientCommissionRate: number
  clientCommissionFixed: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string | null
  typeRent: {
    id: string
    name: string
    description: string
  }
}

/**
 * Get all commissions with their property types
 */
export async function getAllCommissions(): Promise<CommissionWithType[]> {
  try {
    const commissions = await prisma.commission.findMany({
      include: {
        typeRent: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return commissions
  } catch (error) {
    console.error('Error fetching commissions:', error)
    throw new Error('Failed to fetch commissions')
  }
}

/**
 * Get commission by ID
 */
export async function getCommissionById(id: string): Promise<CommissionWithType | null> {
  try {
    const commission = await prisma.commission.findUnique({
      where: { id },
      include: {
        typeRent: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    return commission
  } catch (error) {
    console.error(`Error fetching commission ${id}:`, error)
    throw new Error('Failed to fetch commission')
  }
}

/**
 * Get commission by property type ID
 */
export async function getCommissionByTypeId(typeId: string): Promise<CommissionWithType | null> {
  try {
    const commission = await prisma.commission.findUnique({
      where: { typeRentId: typeId },
      include: {
        typeRent: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    return commission
  } catch (error) {
    console.error(`Error fetching commission for typeId ${typeId}:`, error)
    throw new Error('Failed to fetch commission')
  }
}

/**
 * Create a new commission
 */
export async function createCommission(data: CommissionData): Promise<CommissionWithType> {
  try {
    // Check if commission already exists for this property type
    const existing = await prisma.commission.findUnique({
      where: { typeRentId: data.typeRentId },
    })

    if (existing) {
      throw new Error(`A commission already exists for this property type`)
    }

    // Validate property type exists
    const typeRent = await prisma.typeRent.findUnique({
      where: { id: data.typeRentId },
    })

    if (!typeRent) {
      throw new Error('Property type not found')
    }

    const commission = await prisma.commission.create({
      data: {
        title: data.title,
        description: data.description,
        hostCommissionRate: data.hostCommissionRate,
        hostCommissionFixed: data.hostCommissionFixed,
        clientCommissionRate: data.clientCommissionRate,
        clientCommissionFixed: data.clientCommissionFixed,
        typeRentId: data.typeRentId,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
      },
      include: {
        typeRent: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    // Invalidate cache for this type
    await invalidateTypeCommissionCache(data.typeRentId)

    return commission
  } catch (error) {
    console.error('Error creating commission:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to create commission')
  }
}

/**
 * Update an existing commission
 */
export async function updateCommission(
  id: string,
  data: Partial<CommissionData>
): Promise<CommissionWithType> {
  try {
    // Check if commission exists
    const existing = await prisma.commission.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new Error('Commission not found')
    }

    // If changing typeRentId, check for conflicts
    if (data.typeRentId && data.typeRentId !== existing.typeRentId) {
      const conflict = await prisma.commission.findUnique({
        where: { typeRentId: data.typeRentId },
      })

      if (conflict) {
        throw new Error('A commission already exists for the target property type')
      }
    }

    const commission = await prisma.commission.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        hostCommissionRate: data.hostCommissionRate,
        hostCommissionFixed: data.hostCommissionFixed,
        clientCommissionRate: data.clientCommissionRate,
        clientCommissionFixed: data.clientCommissionFixed,
        typeRentId: data.typeRentId,
        isActive: data.isActive,
      },
      include: {
        typeRent: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    // Invalidate cache for both old and new types
    await invalidateTypeCommissionCache(existing.typeRentId)
    if (data.typeRentId && data.typeRentId !== existing.typeRentId) {
      await invalidateTypeCommissionCache(data.typeRentId)
    }

    return commission
  } catch (error) {
    console.error(`Error updating commission ${id}:`, error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update commission')
  }
}

/**
 * Delete a commission
 */
export async function deleteCommission(id: string): Promise<void> {
  try {
    const commission = await prisma.commission.findUnique({
      where: { id },
    })

    if (!commission) {
      throw new Error('Commission not found')
    }

    await prisma.commission.delete({
      where: { id },
    })

    // Invalidate cache for this type
    await invalidateTypeCommissionCache(commission.typeRentId)
  } catch (error) {
    console.error(`Error deleting commission ${id}:`, error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to delete commission')
  }
}

/**
 * Get all property types without commissions
 * Useful for showing which types still need commission setup
 */
export async function getPropertyTypesWithoutCommissions() {
  try {
    const allTypes = await prisma.typeRent.findMany({
      include: {
        commission: true,
      },
    })

    return allTypes
      .filter(type => !type.commission)
      .map(type => ({
        id: type.id,
        name: type.name,
        description: type.description,
      }))
  } catch (error) {
    console.error('Error fetching property types without commissions:', error)
    throw new Error('Failed to fetch property types')
  }
}

/**
 * Toggle commission active status
 */
export async function toggleCommissionStatus(id: string): Promise<CommissionWithType> {
  try {
    const commission = await prisma.commission.findUnique({
      where: { id },
    })

    if (!commission) {
      throw new Error('Commission not found')
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: {
        isActive: !commission.isActive,
      },
      include: {
        typeRent: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    // Invalidate cache for this type
    await invalidateTypeCommissionCache(commission.typeRentId)

    return updated
  } catch (error) {
    console.error(`Error toggling commission status ${id}:`, error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to toggle commission status')
  }
}
