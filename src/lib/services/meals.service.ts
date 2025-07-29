'use server'
import prisma from '@/lib/prisma'

export async function findAllMeals() {
  try {
    return await prisma.meals.findMany()
  } catch (error) {
    console.error('Erreur lors de la recherche des options sécurité:', error)
    return null
  }
}

export async function findMealById(id: string) {
  try {
    const req = await prisma.meals.findFirst({
      where: {
        id
      }
    })
    if (req) return req;
  } catch (error) {
    console.error('Erreur lors de la recherche d\'un repas', error)
    return null
  }
}

export async function createMeal(name: string) {
  try {
    return await prisma.meals.create({
      data: {
        name
      }
    })
  } catch (error) {
    console.error('Erreur lors de la création d\'un repas', error)
    return null
  }
}

export async function deleteMeal(id: string) {
  try {
    const req = await prisma.meals.delete({
      where: {
        id
      }
    })
    if (req) return true;
  } catch (error) {
    console.error('Erreur lors de la suppresion d\'un repas', error)
    return null
  }
}
