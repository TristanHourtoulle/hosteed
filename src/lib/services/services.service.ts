'use server'
import prisma from '@/lib/prisma'
import { invalidateStaticDataCache } from '@/lib/cache/invalidation'

/**
 * Best-effort static-data cache invalidation. A cache failure must never
 * bubble out of (and be mis-reported as the failure of) a successful DB write.
 */
async function safeInvalidateStaticData(type: 'services'): Promise<void> {
  try {
    await invalidateStaticDataCache(type)
  } catch (cacheError) {
    console.error('Failed to invalidate static-data cache:', cacheError)
  }
}

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
    const result = await prisma.services.create({
      data: {
        name,
      },
    })

    // Invalider le cache après création (best-effort, ne doit jamais masquer l'écriture)
    await safeInvalidateStaticData('services')

    return result
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

    // Invalider le cache après suppression (best-effort, ne doit jamais masquer l'écriture)
    await safeInvalidateStaticData('services')

    if (req) return true
  } catch (error) {
    console.error("Erreur lors de la suppresion d'un service", error)
    return null
  }
}
