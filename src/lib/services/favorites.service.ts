import prisma from '@/lib/prisma'
import { serializeBigInt } from '@/lib/utils/bigint'
import { Prisma } from '@prisma/client'

export async function addToFavorites(userId: string, productId: string) {
  try {
    // Vérifier que l'utilisateur et le produit existent en une seule requête
    const [user, product] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ])

    if (!user) {
      throw new Error('Utilisateur non trouvé')
    }

    if (!product) {
      throw new Error('Produit non trouvé')
    }

    // Créer le favori avec gestion des erreurs spécifiques
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId,
      },
    })
    return { success: true, favorite }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Erreur de clé unique (le favori existe déjà)
      if (error.code === 'P2002') {
        return { success: true, message: 'Ce produit est déjà dans vos favoris' }
      }
      // Erreur de clé étrangère (utilisateur ou produit non trouvé)
      if (error.code === 'P2003') {
        return { success: false, error: 'Utilisateur ou produit non trouvé' }
      }
    }
    console.error('Error adding to favorites:', error)
    return { success: false, error: "Erreur lors de l'ajout aux favoris" }
  }
}

export async function removeFromFavorites(userId: string, productId: string) {
  try {
    const favorite = await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    })
    return { success: true, favorite }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Favori non trouvé
      if (error.code === 'P2025') {
        return { success: false, error: 'Favori non trouvé' }
      }
    }
    console.error('Error removing from favorites:', error)
    return { success: false, error: 'Erreur lors de la suppression du favori' }
  }
}

export async function isFavorite(userId: string, productId: string) {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    })
    return !!favorite
  } catch (error) {
    console.error('Error checking favorite status:', error)
    return false
  }
}

export async function getUserFavorites(userId: string) {
  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
      },
      include: {
        product: {
          include: {
            img: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert BigInt fields to strings for JSON serialization
    return serializeBigInt(favorites)
  } catch (error) {
    console.error('Error fetching user favorites:', error)
    return []
  }
}

export async function getFavoriteCount(productId: string) {
  try {
    const count = await prisma.favorite.count({
      where: {
        productId,
      },
    })
    return count
  } catch (error) {
    console.error('Error getting favorite count:', error)
    return 0
  }
}
