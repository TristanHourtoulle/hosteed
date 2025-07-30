'use server'
import prisma from '@/lib/prisma'

export async function findAllSecurity() {
  try {
    return await prisma.security.findMany()
  } catch (error) {
    console.error('Erreur lors de la recherche des options sécurité:', error)
    return null
  }
}

export async function findSecurityById(id: string) {
  try {
    const req = await prisma.security.findFirst({
      where: {
        id,
      },
    })
    if (req) return req
  } catch (error) {
    console.error("Erreur lors de la recherche d'une option de sécurité", error)
    return null
  }
}

export async function createSecurity(name: string) {
  try {
    return await prisma.security.create({
      data: {
        name,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la création d'une option de sécurité", error)
    return null
  }
}

export async function updateSecurity(id: string, name: string) {
  try {
    return await prisma.security.update({
      where: {
        id,
      },
      data: {
        name,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'une option de sécurité", error)
    return null
  }
}

export async function deleteSecurity(id: string) {
  try {
    const req = await prisma.security.delete({
      where: {
        id,
      },
    })
    if (req) return true
  } catch (error) {
    console.error("Erreur lors de la suppresion d'une option de sécurité", error)
    return null
  }
}
