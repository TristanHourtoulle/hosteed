'use server'
import {prisma} from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {NextResponse} from "next/server";

export async function createMessage(message: string, host: boolean, rentId: string, userId: string) {
    try {
        return await prisma.chat.create({
            data: {
                message,
                host,
                rent: {
                    connect: {id: rentId}
                },
                user: {
                    connect: {id: userId}
                },
                dateSended: new Date().toISOString()
            }
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e }, { status: 500 })
    }
}

export async function getChatRent(rentId: string, viewerIsHost: boolean) {
    try {
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 jours en millisecondes
        const whereClause: Prisma.ChatWhereInput = {
            rentId: rentId
        };
        if (!viewerIsHost) {
            whereClause.dateSended = {
                gte: sixtyDaysAgo.toISOString()
            };
        }
        return await prisma.chat.findMany({
            where: whereClause
        });
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: e }, { status: 500 })
    }
}
