'use server'
import { prisma } from '@/lib/prisma'

export async function findAllMeals() {
  try {
    return await prisma.meals.findMany()
  } catch (error) {
    console.error('Erreur lors de la recherche des options sécurité:', error)
    return null
  }
}
