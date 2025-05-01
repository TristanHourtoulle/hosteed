'use server'
import {prisma} from "@/lib/prisma";

export async function rentById(id: string) {
    try {
        return await prisma.rent.findUnique({
            where: {id},
        });
    } catch (error) {
        console.error("Erreur lors de la recherche du type de location:", error);
        return null;
    }
}

export async function findAllRentByProduct(id: string) {
    try {
        return await prisma.rent.findFirst({
            where: {
                productId: id
            },
        });
    } catch (error) {
        console.error("Erreur lors de la recherche du type de location:", error);
        return null;
    }
}

export async function createRent(params: {
    productId: string,
    userId: string,
    arrivingDate: Date,
    leavingDate: Date,
    peopleNumber: number,
    options: string[],
}) {
    try {
        const product = await prisma.product.findFirst({
            where: {
                id: params.productId
            }
        });
        if (!product) return null;

        const createdRent = await prisma.rent.create({
            data: {
                productId: params.productId,
                userId: params.userId,
                arrivingDate: params.arrivingDate,
                leavingDate: params.leavingDate,
                numberPeople: BigInt(params.peopleNumber),
                notes: BigInt(0),
                accepted: false,
                prices: BigInt(0),
                options: {
                    connect: params.options.map(optionId => ({ id: optionId }))
                }
            },
            include: {
                options: true
            }
        });

        return createdRent;
    } catch (error) {
        console.error("Erreur lors de la création de la réservation:", error);
        return null;
    }
}

export async function findAllRentByUserId(id: string) {
    try {
        return await prisma.rent.findMany({
            where: {
                userId: id,
            },
            include: {
                product: {
                    include: {
                        img: true
                    }
                },
                options: true
            }
        });
    } catch (error) {
        console.error("Erreur lors de la recherche des réservations:", error);
        return null;
    }
}
