'use server'
import prisma from '@/lib/prisma'
import { TypeRent } from '@prisma/client'

export async function findTypeById(id: string): Promise<TypeRent | null> {
  try {
    return await prisma.typeRent.findUnique({
      where: { id },
    })
  } catch (error) {
    console.error('Erreur lors de la recherche du type de location:', error)
    return null
  }
}

export async function findAllTypeRent(): Promise<TypeRent[]> {
  try {
    const result = await prisma.typeRent.findMany()
    return result || []
  } catch (error) {
    console.error('Erreur lors de la recherche des types de location:', error)
    return []
  }
}

export async function createTypeRent(name: string, description: string, isHotelType: boolean = false): Promise<TypeRent | null> {
  try {
    return await prisma.typeRent.create({
      data: {
        name,
        description,
        isHotelType,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la création d'un type de location:", error)
    return null
  }
}

export async function updateTypeRent(
  id: string,
  name: string,
  description: string,
  isHotelType?: boolean
): Promise<TypeRent | null> {
  try {
    const updateData: {
      name: string
      description: string
      isHotelType?: boolean
    } = {
      name,
      description,
    }
    
    if (isHotelType !== undefined) {
      updateData.isHotelType = isHotelType
    }
    
    return await prisma.typeRent.update({
      where: {
        id,
      },
      data: updateData,
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un type de location:", error)
    return null
  }
}

export async function getProductsByTypeRent(typeRentId: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        typeId: typeRentId,
      },
      select: {
        id: true,
        name: true,
        validate: true,
      },
    })
    // Transformer name en title et validate en status pour correspondre à l'interface
    return products.map(product => ({
      id: product.id,
      title: product.name,
      status: product.validate,
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des produits par type:', error)
    return []
  }
}

export async function deleteTypeRent(id: string): Promise<boolean> {
  try {
    await prisma.typeRent.delete({
      where: {
        id,
      },
    })
    return true
  } catch (error) {
    console.error("Erreur lors de la suppression d'un type de location:", error)
    return false
  }
}

export async function deleteTypeRentWithProducts(id: string): Promise<boolean> {
  try {
    // Supprimer d'abord tous les produits associés
    await prisma.product.deleteMany({
      where: {
        typeId: id,
      },
    })
    
    // Puis supprimer le type de location
    await prisma.typeRent.delete({
      where: {
        id,
      },
    })
    return true
  } catch (error) {
    console.error("Erreur lors de la suppression du type de location et ses produits:", error)
    return false
  }
}
