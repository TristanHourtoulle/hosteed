'use server'
import prisma from '@/lib/prisma'

export async function findAllServices(limit?: number) {
  try {
    const queryOptions: { orderBy: { name: 'asc' }; take?: number } = {
      orderBy: { name: 'asc' },
    }

    // Only add take if limit is specified (for backward compatibility)
    if (limit !== undefined) {
      queryOptions.take = limit
    }

    const result = await prisma.services.findMany(queryOptions)
    return result || []
  } catch (error) {
    console.error('Erreur lors de la recherche des services:', error)
    return []
  }
}

// Wrapper function for TanStack Query (no parameters)
export async function findAllServicesForQuery() {
  return findAllServices()
}

export async function createService(name: string) {
  try {
    return await prisma.services.create({
      data: {
        name,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la création d'un service", error)
    return null
  }
}

export async function deleteService(id: string) {
  try {
    const req = await prisma.services.delete({
      where: {
        id,
      },
    })
    if (req) return true
  } catch (error) {
    console.error("Erreur lors de la suppresion d'un service", error)
    return null
  }
}
