import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { RentStatus } from '@prisma/client'
import { z } from 'zod'
import { approveRent, cancelRent, changeRentStatus } from '@/lib/services/rent-lifecycle.service'

const statusChangeSchema = z.object({
  status: z.enum(['RESERVED', 'CHECKIN', 'CHECKOUT', 'CANCEL']),
  reason: z.string().optional(),
})

const VALID_TRANSITIONS: Record<RentStatus, RentStatus[]> = {
  WAITING: [RentStatus.RESERVED, RentStatus.CANCEL],
  RESERVED: [RentStatus.CHECKIN, RentStatus.CANCEL],
  CHECKIN: [RentStatus.CHECKOUT, RentStatus.CANCEL],
  CHECKOUT: [],
  CANCEL: [],
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'AUTH_001', message: 'Accès réservé aux administrateurs' } },
        { status: 403 }
      )
    }

    const { id } = await params

    const body = await request.json()
    const parsed = statusChangeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'BOOKING_001', message: parsed.error.errors[0].message } },
        { status: 400 }
      )
    }

    const { status: newStatus } = parsed.data

    const rent = await prisma.rent.findUnique({
      where: { id },
      select: { id: true, status: true },
    })

    if (!rent) {
      return NextResponse.json(
        { error: { code: 'BOOKING_002', message: 'Réservation introuvable' } },
        { status: 404 }
      )
    }

    const allowedTransitions = VALID_TRANSITIONS[rent.status]
    if (!allowedTransitions.includes(newStatus as RentStatus)) {
      return NextResponse.json(
        {
          error: {
            code: 'BOOKING_003',
            message: `Transition invalide: ${rent.status} vers ${newStatus}`,
          },
        },
        { status: 400 }
      )
    }

    if (newStatus === 'CANCEL') {
      const result = await cancelRent(id)
      if (result?.error) {
        return NextResponse.json(
          { error: { code: 'BOOKING_004', message: result.error } },
          { status: 500 }
        )
      }
    } else if (rent.status === 'WAITING' && newStatus === 'RESERVED') {
      const result = await approveRent(id)
      if (!result.success) {
        return NextResponse.json(
          { error: { code: 'BOOKING_005', message: 'Échec de la capture du paiement Stripe' } },
          { status: 500 }
        )
      }
    } else {
      await changeRentStatus(id, newStatus as RentStatus)
    }

    const updatedRent = await prisma.rent.findUnique({
      where: { id },
      select: { id: true, status: true, payment: true, updatedAt: true },
    })

    return NextResponse.json({ success: true, rent: updatedRent })
  } catch (error) {
    console.error('Error changing reservation status:', error)
    return NextResponse.json(
      { error: { code: 'BOOKING_500', message: 'Erreur interne du serveur' } },
      { status: 500 }
    )
  }
}
