'use server'

import prisma from '@/lib/prisma'

export async function createPromotedProduct(
  active: boolean,
  start: Date,
  end: Date,
  productId: string
) {
  try {
    return await prisma.promotedProduct.create({
      data: {
        active,
        start,
        end,
        product: {
          connect: {
            id: productId,
          },
        },
      },
    })
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function getActualProduct() {
  try {
    const now = new Date()
    const promotedProducts = await prisma.promotedProduct.findMany({
      where: {
        active: true,
        start: { lte: now },
        end: { gte: now },
      },
      include: {
        product: {
          include: {
            img: true,
            type: true,
            reviews: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })
    return promotedProducts
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function getAllPromotedProducts() {
  try {
    return await prisma.promotedProduct.findMany({
      include: {
        product: {
          include: {
            img: true,
            type: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        start: 'desc',
      },
    })
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function updatePromotedProduct(id: string, active: boolean, start: Date, end: Date) {
  try {
    return await prisma.promotedProduct.update({
      where: { id },
      data: {
        active,
        start,
        end,
      },
    })
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function deletePromotedProduct(id: string) {
  try {
    return await prisma.promotedProduct.delete({
      where: { id },
    })
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function getProductsAvailableForPromotion() {
  try {
    // Récupère tous les produits qui ne sont pas déjà sponsorisés actuellement
    const now = new Date()
    const currentlyPromotedProductIds = await prisma.promotedProduct.findMany({
      where: {
        active: true,
        start: { lte: now },
        end: { gte: now },
      },
      select: { productId: true },
    })

    const promotedIds = currentlyPromotedProductIds.map(p => p.productId)

    return await prisma.product.findMany({
      where: {
        validate: 'Approve',
        id: {
          notIn: promotedIds,
        },
      },
      include: {
        img: true,
        type: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function getPromotedProductByProductId(productId: string) {
  try {
    return await prisma.promotedProduct.findFirst({
      where: {
        productId,
      },
      orderBy: {
        start: 'desc',
      },
    })
  } catch (e) {
    console.error(e)
    return null
  }
}
