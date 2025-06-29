'use server'
import prisma from '@/lib/prisma'

export async function findAllServices() {
  try {
    return await prisma.services.findMany()
  } catch (error) {
    console.error('Erreur lors de la recherche des services:', error)
    return null
  }
}
