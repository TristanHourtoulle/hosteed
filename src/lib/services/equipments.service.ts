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
export async function findEquipmentById(id: string) {
  try {
    const req = await prisma.equipment.findFirst({
      where: {
        id
      }
    })
    if (req) return req;
  } catch (error) {
    console.error('Erreur lors de la recherche d\'un équipement', error)
    return null
  }
}
export async function createEquipment(name: string, icon: string) {
  try {
    return await prisma.equipment.create({
      data: {
        name,
        icon
      }
    })
  } catch (error) {
    console.error('Erreur lors de la création des equipements', error)
    return null
  }
}

export async function deleteEquipement(id: string) {
   try {
     const req = await prisma.equipment.delete({
       where: {
         id
       }
     })
     if (req) return true;
   } catch (error) {
     console.error('Erreur lors de la suppresion d\'un equipement', error)
     return null
   }
}

