import prisma from "@/lib/prisma";
import { DayEnum } from "@prisma/client"
export async function createSpecialPrices(pricesMga: string, pricesEuro: String, day: DayEnum[], startDate: Date | null, endDate: Date | null, activate: boolean, productId: string ) {
    try {
        console.log('=== createSpecialPrices called ===')
        console.log('Parameters:', { pricesMga, pricesEuro, day, startDate, endDate, activate, productId })

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
                productId
            }
        })

        console.log('Special price created in DB:', result)
        return result
    } catch (error) {
        console.error('Erreur lors de la création d\'un prix spécial', error)
        return null
    }
}

export async function findSpecialsPricesByProduct(id: string) {
    try {
        return await prisma.specialPrices.findMany({
            where: {
                productId: id
            }
        })
    } catch (error) {
        console.error('Erreur lors de la création d\'un service', error)
        return null
    }
}
