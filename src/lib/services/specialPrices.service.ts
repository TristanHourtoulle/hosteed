'use server'
import prisma from '@/lib/prisma'
import { DayEnum } from '@prisma/client'
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
    console.log('=== createSpecialPrices called ===')
    console.log('Parameters:', {
      pricesMga,
      pricesEuro,
      day,
      startDate,
      endDate,
      activate,
      productId,
    })

    // Essayer différentes variantes du nom du modèle
    console.log('Available models:', Object.keys(prisma))

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

    console.log('Special price created in DB:', result)
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
    console.error("Erreur lors de la création d'un service", error)
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
    console.log('=== updateSpecialPrices called ===')
    console.log('Parameters:', { id, pricesMga, pricesEuro, day, startDate, endDate, activate })

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

    console.log('Special price updated in DB:', result)
    return result
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un prix spécial", error)
    return null
  }
}

export async function toggleSpecialPriceStatus(id: string, activate: boolean) {
  try {
    console.log('=== toggleSpecialPriceStatus called ===')
    console.log('Parameters:', { id, activate })

    const result = await prisma.specialPrices.update({
      where: {
        id: id,
      },
      data: {
        activate: activate,
      },
    })

    console.log('Special price status updated in DB:', result)
    return result
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du prix spécial', error)
    return null
  }
}

export async function deleteSpecialsPricesByProduct(id: string) {
  try {
    return await prisma.specialPrices.delete({
      where: {
        id: id,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la suppression d'un prix spécial", error)
    return null
  }
}
