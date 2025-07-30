'use server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

export async function createMessage(
  message: string,
  host: boolean,
  rentId: string,
  userId: string
) {
  try {
    return await prisma.chat.create({
      data: {
        message,
        host,
        rent: {
          connect: { id: rentId },
        },
        user: {
          connect: { id: userId },
        },
        dateSended: new Date(),
        read: false,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e }, { status: 500 })
  }
}

export async function getChatRent(rentId: string, viewerIsHost: boolean) {
  try {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 jours en millisecondes
    const whereClause: Prisma.ChatWhereInput = {
      rent: {
        id: rentId,
      },
    }
    // Si c'est un client qui consulte, on limite aux 60 derniers jours
    // Si c'est un hôte, on montre tous les messages
    if (!viewerIsHost) {
      whereClause.dateSended = {
        gte: sixtyDaysAgo,
      }
    }
    return await prisma.chat.findMany({
      where: whereClause,
      orderBy: {
        dateSended: 'asc',
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e }, { status: 500 })
  }
}

export async function getAllUserChats(userId: string) {
  try {
    return await prisma.chat.findMany({
      where: {
        OR: [
          {
            userId: userId,
          },
          {
            rent: {
              product: {
                user: {
                  some: {
                    id: userId,
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        rent: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
            user: true,
          },
        },
      },
      orderBy: {
        dateSended: 'desc',
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e }, { status: 500 })
  }
}

export async function markMessagesAsRead(rentId: string, userId: string) {
  try {
    return await prisma.chat.updateMany({
      where: {
        rentId: rentId,
        userId: {
          not: userId, // Marquer comme lu tous les messages qui ne sont pas de l'utilisateur
        },
        read: false,
      },
      data: {
        read: true,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e }, { status: 500 })
  }
}
