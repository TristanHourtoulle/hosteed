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

export async function findAllTypeRent(): Promise<TypeRent[] | null> {
  try {
    return await prisma.typeRent.findMany()
  } catch (error) {
    console.error('Erreur lors de la recherche des types de location:', error)
    return null
  }
}

export async function createTypeRent(name: string, description: string): Promise<TypeRent | null> {
  try {
    return await prisma.typeRent.create({
      data: {
        name,
        description,
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
  description: string
): Promise<TypeRent | null> {
  try {
    return await prisma.typeRent.update({
      where: {
        id,
      },
      data: {
        name,
        description,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un type de location:", error)
    return null
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
