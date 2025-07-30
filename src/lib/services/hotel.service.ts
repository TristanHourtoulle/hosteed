'use server'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function create({
  name,
  number,
  adress,
  manager,
}: {
  name: string
  number: string
  adress: string
  manager: string
}) {
  try {
    return await prisma.hotel.create({
      data: {
        name,
        number,
        adress,
        user: {
          connect: { id: manager },
        },
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e }, { status: 500 })
  }
}

export async function findHotelById({ id }: { id: string }) {
  try {
    return await prisma.hotel.findUnique({
      where: {
        id: id,
      },
      include: {
        room: true,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e }, { status: 500 })
  }
}

export async function findHotelByManagerId({ id }: { id: string }) {
  try {
    return await prisma.hotel.findMany({
      where: {
        userId: id,
      },
      include: {
        room: true,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e }, { status: 500 })
  }
}
