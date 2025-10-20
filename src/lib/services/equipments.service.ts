'use server'
import prisma from '@/lib/prisma'
import { invalidateStaticDataCache } from '@/lib/cache/invalidation'

export async function findAllEquipments() {
  try {
    const result = await prisma.equipment.findMany()
    return result || []
  } catch (error) {
    console.error('Erreur lors de la recherche des équipements:', error)
    return []
  }
}
export async function findEquipmentById(id: string) {
  try {
    const req = await prisma.equipment.findFirst({
      where: {
        id,
      },
    })
    if (req) return req
  } catch (error) {
    console.error("Erreur lors de la recherche d'un équipement", error)
    return null
  }
}
export async function createEquipment(name: string, icon: string) {
  try {
    const result = await prisma.equipment.create({
      data: {
        name,
        icon,
      },
    })

    // Invalider le cache après création
    await invalidateStaticDataCache('equipments')

    return result
  } catch (error) {
    console.error('Erreur lors de la création des equipements', error)
    return null
  }
}

export async function updateEquipment(id: string, name: string, icon: string) {
  try {
    const result = await prisma.equipment.update({
      where: {
        id,
      },
      data: {
        name,
        icon,
      },
    })

    // Invalider le cache après modification
    await invalidateStaticDataCache('equipments')

    return result
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un équipement", error)
    return null
  }
}

export async function deleteEquipement(id: string) {
  try {
    const req = await prisma.equipment.delete({
      where: {
        id,
      },
    })

    // Invalider le cache après suppression
    await invalidateStaticDataCache('equipments')

    if (req) return true
  } catch (error) {
    console.error("Erreur lors de la suppresion d'un equipement", error)
    return null
  }
}
