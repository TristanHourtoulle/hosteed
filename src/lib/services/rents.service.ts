'use server'
import {prisma} from "@/lib/prisma";
import {Prisma} from "@prisma/client";
import {StripeService} from "@/lib/services/stripe";

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
        arrivingDate: rent.arrivingDate,
        leavingDate: rent.leavingDate,
    };
}

export async function getRentById(id: string): Promise<RentWithDates | null> {
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
    stripeId: string,
}): Promise<RentWithRelations | null> {
    try {
        if (!params.productId || !params.userId || !params.arrivingDate || !params.leavingDate || !params.peopleNumber) {
            console.error("Paramètres manquants pour la création de la réservation:", params);
            return null;
        }

        const user = await prisma.user.findUnique({
            where: {
                id: params.userId
            }
        });

        if (!user) {
            console.error("Utilisateur non trouvé:", params.userId);
            return null;
        }

        const product = await prisma.product.findFirst({
            where: {
                id: params.productId
            }
        });

        if (!product) {
            console.error("Produit non trouvé:", params.productId);
            return null;
        }

        const isAvailable = await CheckRentIsAvailable(
            params.productId,
            params.arrivingDate,
            params.leavingDate
        );

        if (!isAvailable) {
            console.error("Le produit n'est pas disponible pour les dates sélectionnées");
            return null;
        }

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
                stripeId: params.stripeId,
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
        console.error("Erreur détaillée lors de la création de la réservation:", error);
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
                options: true,
            }
        });

        return rents;
    } catch (error) {
        console.error("Erreur lors de la recherche des réservations:", error);
        return null;
    }
}

export async function findRentByHostUserId(id: string) {
    try {
        const rents = await prisma.rent.findMany({
            where: {
                product: {
                    userId: id,
                }
            },
        });

        return rents;
    } catch (error) {
        console.error("Erreur lors de la recherche des réservations:", error);
        return null;
    }
}

export async function cancelRent(id: string) {
    try {
        const rents = await prisma.rent.findUnique({
            where: {
                id: id
            },
        });
        if (!rents) throw Error('No Rents find');
        const stripeRequest = await StripeService.RefundPaymentIntent(rents.stripeId);
        console.log(stripeRequest)
        if (!stripeRequest) throw Error(stripeRequest);
        await prisma.rent.update({
            where: {
                id: id,
            },
            data: {
                status: 'CANCEL',
            }
        })
    } catch (e) {
        console.error('Erreur lors de la création du PaymentIntent:', e);
        return {
            error: 'Erreur lors de la création du paiement',
        };
    }
}
