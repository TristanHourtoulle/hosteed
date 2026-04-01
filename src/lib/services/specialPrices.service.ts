'use server'
import prisma from '@/lib/prisma'
import { DayEnum } from '@prisma/client'
import { invalidateProductCache } from '@/lib/cache/invalidation'

export async function createSpecialPrices(
  pricesMga: string,
  pricesEuro: string,
  day: DayEnum[],
  startDate: Date | null,
  endDate: Date | null,
  activate: boolean,
  productId: string
) {
  try {
    const result = await prisma.specialPrices.create({
      data: {
        pricesMga,
        pricesEuro,
        day,
        startDate,
        endDate,
        activate,
        productId,
      },
    })

    await invalidateProductCache(productId)
    return result
  } catch (error) {
    console.error("Erreur lors de la création d'un prix spécial", error)
    return null
  }
}

export async function findSpecialsPricesByProduct(id: string) {
  try {
    return await prisma.specialPrices.findMany({
      where: {
        productId: id,
      },
    })
  } catch (error) {
    console.error('Erreur lors de la recherche des prix spéciaux', error)
    return null
  }
}

export async function updateSpecialPrices(
  id: string,
  pricesMga: string,
  pricesEuro: string,
  day: DayEnum[],
  startDate: Date | null,
  endDate: Date | null,
  activate: boolean
) {
  try {
    const result = await prisma.specialPrices.update({
      where: {
        id: id,
      },
      data: {
        pricesMga,
        pricesEuro,
        day,
        startDate,
        endDate,
        activate,
      },
    })

    await invalidateProductCache(result.productId)
    return result
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un prix spécial", error)
    return null
  }
}

export async function toggleSpecialPriceStatus(id: string, activate: boolean) {
  try {
    const result = await prisma.specialPrices.update({
      where: {
        id: id,
      },
      data: {
        activate: activate,
      },
    })

    await invalidateProductCache(result.productId)
    return result
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du prix spécial', error)
    return null
  }
}

export async function deleteSpecialsPricesByProduct(id: string) {
  try {
    const result = await prisma.specialPrices.delete({
      where: {
        id: id,
      },
    })

    await invalidateProductCache(result.productId)
    return result
  } catch (error) {
    console.error("Erreur lors de la suppression d'un prix spécial", error)
    return null
  }
}
