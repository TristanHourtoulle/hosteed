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

export async function createService(name: string) {
  try {
    return await prisma.services.create({
      data: {
        name
      }
    })
  } catch (error) {
    console.error('Erreur lors de la création d\'un service', error)
    return null
  }
}

export async function deleteService(id: string) {
  try {
    const req = await prisma.services.delete({
      where: {
        id
      }
    })
    if (req) return true;
  } catch (error) {
    console.error('Erreur lors de la suppresion d\'un service', error)
    return null
  }
}
