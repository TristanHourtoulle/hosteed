import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deleteReview } from '@/lib/services/reviews.service'
import prisma from '@/lib/prisma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
    }

    const review = await prisma.review.findUnique({
      where: { id },
      select: { rentId: true, rentRelation: { select: { prices: true } } },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    await deleteReview(id)

    // Clean up fake rent if it was created for an admin review (prices === 0 or 100)
    const rentPrices = Number(review.rentRelation.prices)
    if (rentPrices === 0 || rentPrices === 100) {
      await prisma.rent.delete({ where: { id: review.rentId } }).catch(() => {
        // Rent may already be deleted or have other reviews, ignore
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
