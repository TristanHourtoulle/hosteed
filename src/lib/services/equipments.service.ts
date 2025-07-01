'use server'
import prisma from '@/lib/prisma'

export async function findAllEquipments() {
  try {
    return await prisma.equipment.findMany()
  } catch (error) {
    console.error('Erreur lors de la recherche des équipements:', error)
    return null
  }
}
