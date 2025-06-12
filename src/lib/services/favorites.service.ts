import { prisma } from '@/lib/prisma'
import { serializeBigInt } from '@/lib/utils/bigint'

export async function addToFavorites(userId: string, productId: string) {
  try {
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId,
      },
    })
    return favorite
  } catch (error) {
    console.error('Error adding to favorites:', error)
    return null
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
    return favorite
  } catch (error) {
    console.error('Error removing from favorites:', error)
    return null
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
