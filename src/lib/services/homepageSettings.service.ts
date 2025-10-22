'use server'
import prisma from '@/lib/prisma'
import { HomepageSettings } from '@prisma/client'

export async function getHomepageSettings(): Promise<HomepageSettings | null> {
  try {
    // Il n'y aura qu'un seul enregistrement de paramètres
    const settings = await prisma.homepageSettings.findFirst()
    return settings
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de la homepage:', error)
    return null
  }
}

export async function updateHomepageSettings(data: {
  heroBackgroundImage?: string | null
  howItWorksImage?: string | null
}): Promise<HomepageSettings | null> {
  try {
    // Récupérer l'enregistrement existant ou créer un nouveau
    const existing = await prisma.homepageSettings.findFirst()

    if (existing) {
      // Mettre à jour l'enregistrement existant
      return await prisma.homepageSettings.update({
        where: { id: existing.id },
        data,
      })
    } else {
      // Créer un nouvel enregistrement
      return await prisma.homepageSettings.create({
        data,
      })
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres de la homepage:', error)
    return null
  }
}

export async function getOrCreateHomepageSettings(): Promise<HomepageSettings> {
  try {
    const existing = await prisma.homepageSettings.findFirst()

    if (existing) {
      return existing
    }

    // Créer avec des valeurs par défaut
    return await prisma.homepageSettings.create({
      data: {},
    })
  } catch (error) {
    console.error('Erreur lors de la création des paramètres de la homepage:', error)
    throw error
  }
}
