'use server'
import prisma from '@/lib/prisma'
import { invalidateStaticDataCache } from '@/lib/cache/invalidation'

/**
 * Best-effort static-data cache invalidation. A cache failure must never
 * bubble out of (and be mis-reported as the failure of) a successful DB write.
 */
async function safeInvalidateStaticData(type: 'meals'): Promise<void> {
  try {
    await invalidateStaticDataCache(type)
  } catch (cacheError) {
    console.error('Failed to invalidate static-data cache:', cacheError)
  }
}

export async function findAllMeals() {
  try {
    const result = await prisma.meals.findMany()
    return result || []
  } catch (error) {
    console.error('Erreur lors de la recherche des options sécurité:', error)
    return []
  }
}

export async function findMealById(id: string) {
  try {
    const req = await prisma.meals.findFirst({
      where: {
        id,
      },
    })
    if (req) return req
  } catch (error) {
    console.error("Erreur lors de la recherche d'un repas", error)
    return null
  }
}

export async function createMeal(name: string) {
  try {
    const result = await prisma.meals.create({
      data: {
        name,
      },
    })

    // Invalider le cache après création (best-effort, ne doit jamais masquer l'écriture)
    await safeInvalidateStaticData('meals')

    return result
  } catch (error) {
    console.error("Erreur lors de la création d'un repas", error)
    return null
  }
}

export async function updateMeal(id: string, name: string) {
  try {
    const result = await prisma.meals.update({
      where: {
        id,
      },
      data: {
        name,
      },
    })

    // Invalider le cache après modification (best-effort, ne doit jamais masquer l'écriture)
    await safeInvalidateStaticData('meals')

    return result
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un repas", error)
    return null
  }
}

export async function deleteMeal(id: string) {
  try {
    const req = await prisma.meals.delete({
      where: {
        id,
      },
    })

    // Invalider le cache après suppression (best-effort, ne doit jamais masquer l'écriture)
    await safeInvalidateStaticData('meals')

    if (req) return true
  } catch (error) {
    console.error("Erreur lors de la suppresion d'un repas", error)
    return null
  }
}
