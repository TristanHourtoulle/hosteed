'use server'
import prisma from '@/lib/prisma'
import { sendTemplatedMail } from '@/lib/services/sendTemplatedMail'

export async function findAllReviews() {
  try {
    return await prisma.review.findMany({
      include: {
        rentRelation: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })
  } catch (error) {
    console.error('Erreur lors de la recherche des avis:', error)
    return null
  }
}

export async function findAllWaitingReview() {
  try {
    return await prisma.review.findMany({
      where: {
        approved: false,
      },
      include: {
        rentRelation: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })
  } catch (error) {
    console.error('Erreur lors de la recherche des avis:', error)
    return null
  }
}

export async function createReview(params: {
  productId: string
  rentId: string
  userId: string
  grade: number
  welcomeGrade: number
  staff: number
  comfort: number
  equipment: number
  cleaning: number
  title: string
  text: string
  visitingDate: Date
  publishDate: Date
}) {
  try {
    // Verify that the rent exists and belongs to the user
    const rent = await prisma.rent.findUnique({
      where: {
        id: params.rentId,
        userId: params.userId,
        status: {
          in: ['CHECKIN', 'CHECKOUT'],
        },
      },
    })
    if (!rent) throw new Error('Réservation invalide ou non éligible pour un avis')

    // Check if a review already exists for this rent
    const existingReview = await prisma.review.findFirst({
      where: {
        rentRelation: {
          id: params.rentId,
        },
      },
    })
    if (existingReview) throw new Error('Un avis a déjà été laissé pour cette réservation')

    const user = await prisma.user.findUnique({ where: { id: params.userId } })
    if (!user) throw new Error('No user found')

    const review = await prisma.review.create({
      data: {
        title: params.title,
        text: params.text,
        product: { connect: { id: params.productId } },
        rentRelation: { connect: { id: params.rentId } },
        grade: params.grade,
        welcomeGrade: params.welcomeGrade,
        staff: params.staff,
        comfort: params.comfort,
        equipment: params.equipment,
        cleaning: params.cleaning,
        visitDate: params.visitingDate,
        publishDate: params.publishDate,
        approved: false,
      },
      include: {
        rentRelation: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    const admins = await prisma.user.findMany({
      where: { roles: 'ADMIN' },
    })

    for (const admin of admins) {
      await sendTemplatedMail(admin.email, 'Nouvel avis posté !', 'validation-avis.html', {
        reviewUrl: process.env.NEXTAUTH_URL + '/admin/reviews',
      })
    }

    return review
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export async function approveReview(id: string) {
  try {
    const review = await prisma.review.update({
      where: { id },
      data: { approved: true },
      include: {
        rentRelation: {
          include: {
            product: {
              include: {
                owner: true,
              },
            },
          },
        },
      },
    })

    if (!review?.rentRelation?.product?.owner) {
      throw new Error('No review found or impossible to update')
    }

    await sendTemplatedMail(review.rentRelation.product.owner.email, 'Nouvel avis posté !', 'new-review.html', {
      reviewUrl: process.env.NEXTAUTH_URL + '/host/' + review.rentRelation.product.id,
    })

    return review
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export async function deleteReview(id: string) {
  try {
    return await prisma.review.delete({
      where: { id },
    })
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}
