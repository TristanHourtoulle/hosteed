'use server'
import {prisma} from "@/lib/prisma";
import {Prisma} from "@prisma/client";

// Fonctions utilitaires pour la conversion Date <-> BigInt
function dateToBigInt(date: Date): bigint {
    return BigInt(date.getTime());
}

function bigIntToDate(timestamp: bigint): Date {
    return new Date(Number(timestamp));
}

type RentWithRelations = Prisma.RentGetPayload<{
    include: {
        product: {
            include: {
                img: true;
            };
        };
        options: true;
    };
}>;

type RentWithDates = Omit<RentWithRelations, 'arrivingDate' | 'leavingDate'> & {
    arrivingDate: Date;
    leavingDate: Date;
};

function convertRentToDates(rent: RentWithRelations): RentWithDates {
    return {
        ...rent,
        arrivingDate: bigIntToDate(rent.arrivingDate),
        leavingDate: bigIntToDate(rent.leavingDate)
    };
}

export async function rentById(id: string): Promise<RentWithDates | null> {
    try {
        const rent = await prisma.rent.findUnique({
            where: {id},
            include: {
                product: {
                    include: {
                        img: true
                    }
                },
                options: true
            }
        });
        if (rent) {
            return convertRentToDates(rent);
        }
        return null;
    } catch (error) {
        console.error("Erreur lors de la recherche du type de location:", error);
        return null;
    }
}

export async function CheckRentIsAvailable(productId: string, arrivalDate: Date, leavingDate: Date): Promise<boolean> {
    try {
        const existingRent = await prisma.rent.findFirst({
            where: {
                productId: productId,
                AND: [
                    { arrivingDate: { lte: leavingDate } },
                    { leavingDate: { gte: arrivalDate } }
                ]
            }
        });
        return existingRent === null;
    } catch (error) {
        console.error("Erreur lors de la vérification de la disponibilité:", error);
        return false;
    }
}

export async function findAllRentByProduct(id: string): Promise<RentWithDates | null> {
    try {
        const rent = await prisma.rent.findFirst({
            where: {
                productId: id
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
        if (rent) {
            return convertRentToDates(rent);
        }
        return null;
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
}): Promise<RentWithRelations | null> {
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
                product: {
                    include: {
                        img: true
                    }
                },
                options: true
            }
        });

        return createdRent;
    } catch (error) {
        console.error("Erreur lors de la création de la réservation:", error);
        return null;
    }
}

export async function findAllRentByUserId(id: string): Promise<RentWithRelations[] | null> {
    try {
        const rents = await prisma.rent.findMany({
            where: {
                userId: id
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

        return rents;
    } catch (error) {
        console.error("Erreur lors de la recherche des réservations:", error);
        return null;
    }
}
