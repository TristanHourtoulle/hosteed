'use server'

import prisma from "@/lib/prisma";
import {NextResponse} from "next/server";

export async function createPromotedProduct(active: boolean, start: Date, end: Date, productId: string) {
    try {
        return await prisma.promotedProduct.create({
            data: {
                active,
                start,
                end,
                product: {
                    connect: {
                        id: productId
                    }
                }
            }
        })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: e }, { status: 500 })
    }
}

export async function getActualProduct() {
    try {
        const now = new Date();
        const promotedProducts = await prisma.promotedProduct.findMany({
            where: {
                active: true,
                start: { lte: now },
                end: { gte: now }
            },
            include: {
                product: true
            }
        });
        return promotedProducts;
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: e }, { status: 500 })
    }
}
