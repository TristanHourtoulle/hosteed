'use server'
import {prisma} from "@/lib/prisma";
import {Prisma, RentStatus} from "@prisma/client";
import {StripeService} from "@/lib/services/stripe";
import {sendTemplatedMail} from "@/lib/services/sendTemplatedMail";
import {findAllUserByRoles} from "@/lib/services/user.service";
export interface FormattedRent {
    id: string;
    title: string;
    start: string;
    end: string;
    propertyId: string;
    propertyName: string;
    status: RentStatus;
}

export interface RentDetails {
    id: string;
    productId: string;
    productName: string;
    userId: string;
    userName: string;
    numberPeople: number;
    notes: string;
    prices: number;
    arrivingDate: string;
    leavingDate: string;
    status: RentStatus;
    payment: string;
}
type RentWithRelations = Prisma.RentGetPayload<{
    include: {
        product: {
            include: {
                img: true;
                type: true;
                user: {
                    select: {
                        id: true;
                        name: true;
                        email: true;
                    }
                };
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
                        img: true,
                        user: true,
                        type: true,
                    }
                },
                options: true,
                user: true,
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
                        img: true,
                        type: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        }
                    }
                },
                user: true,
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
    prices: number,
}): Promise<RentWithRelations | null> {
    try {
        if (!params.productId || !params.userId || !params.arrivingDate || !params.leavingDate || !params.peopleNumber|| !params.prices) {
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
                prices: BigInt(params.prices),
                stripeId: params.stripeId || null,
                options: {
                    connect: params.options.map(optionId => ({ id: optionId }))
                }
            },
            include: {
                product: {
                    include: {
                        img: true,
                        type: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        }
                    }
                },
                user: true,
                options: true
            }
        });
        const request = await prisma.product.findUnique({
            where: {id: createdRent.productId},
            select: {
                type: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });
        if (!request) return null;
        const admin = await findAllUserByRoles('ADMIN');
        admin?.map(async (user) => {
            await sendTemplatedMail(
                user.email,
                'Nouvelle réservation !',
                'new-book.html',
                {
                    bookId: createdRent.id,
                    name: user.name || '',
                    bookUrl: (process.env.NEXTAUTH_URL + '/reservation/' + createdRent.id),
                }
            );
        })
        if (!createdRent.product.user || !Array.isArray(createdRent.product.user)) {
            console.error("Les utilisateurs du produit ne sont pas disponibles");
            return null;
        }

        createdRent.product.user.map(async (host) => {
            await sendTemplatedMail(
                host.email,
                'Nouvelle réservation !',
                'new-book.html',
                {
                    bookId: createdRent.id,
                    name: host.name || '',
                    bookUrl: (process.env.NEXTAUTH_URL + '/reservation/' + createdRent.id),
                }
            );
        })
        await sendTemplatedMail(
            createdRent.user.email,
            'Réservation confirmée 🏨',
            'confirmation-reservation.html',
            {
                name: createdRent.user.name || '',
                listing_title: createdRent.product.name,
                listing_adress: createdRent.product.address,
                check_in: createdRent.product.arriving,
                check_out: createdRent.product.leaving,
                categories: createdRent.product.type.name,
                phone_number: createdRent.product.phone,
                arriving_date: createdRent.arrivingDate.toDateString(),
                leaving_date: createdRent.leavingDate.toDateString(),
                reservationUrl: (process.env.NEXTAUTH_URL + '/reservation/' + createdRent.id),
            }
        );
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
                        img: true,
                        type: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        }
                    }
                },
                user: true,
                options: true
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
                    user: {
                        some: {
                            id: id
                        }
                    }
                }
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        return rents;
    } catch (error) {
        console.error("Erreur lors de la recherche des locations:", error);
        return null;
    }
}
export async function findAllReservationsByHostId(hostId: string): Promise<FormattedRent[]> {
    try {
        const rents = await prisma.rent.findMany({
            where: {
                product: {
                    user: {
                        some: {
                            id: hostId
                        }
                    }
                }
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                arrivingDate: 'asc'
            }
        });

        return rents.map(rent => ({
            id: rent.id,
            title: `Réservation #${rent.id}`,
            start: rent.arrivingDate.toISOString(),
            end: rent.leavingDate.toISOString(),
            propertyId: rent.productId,
            propertyName: rent.product.name,
            status: rent.status
        }));
    } catch (error) {
        console.error('Erreur lors de la récupération des réservations:', error);
        throw error;
    }
}


export async function cancelRent(id: string) {
    try {
        const rents = await prisma.rent.findUnique({
            where: {
                id: id
            },
            include: {
                user: true,
                product: true,
            }
        });
        if (!rents || !rents.user) throw Error('No Rents find');
        if (rents.stripeId) {
            const stripeRequest = await StripeService.RefundPaymentIntent(rents.stripeId);
            if (!stripeRequest) throw Error(stripeRequest);
            await prisma.rent.update({
                where: {
                    id: id,
                },
                data: {
                    status: 'CANCEL',
                }
            })
        }
        await sendTemplatedMail(
            rents.user.email,
            'Annulation de votre réservation',
            'annulation.html',
            {
                name: rents.user.name || 'clients',
                productName: rents.product.name,
                arrivingDate: rents.arrivingDate.toDateString(),
                leavingDate: rents.leavingDate.toDateString(),
                reservationId: rents.id,
                refundAmount: rents.prices.toString()
            }
        );
    } catch (e) {
        console.error('Erreur lors de la création du PaymentIntent:', e);
        return {
            error: 'Erreur lors de la création du paiement',
        };
    }
}

export async function changeRentStatus(id: string, status: RentStatus) {
    try {
        const rent = await prisma.rent.findUnique({
            where: {id},
            include: {
                user: true,
                product: true,
            }
        })
        if (!rent) throw Error('No Rents found');
        await prisma.rent.update({
            where: {id},
            data: {
                status: status
            }
        });
        if (status == RentStatus.CHECKOUT) {
            await sendTemplatedMail(
                rent.user.email,
                'Votre avis compte pour nous !',
                'review-request.html',
                {
                    rentId: rent.id,
                    reviewUrl: (process.env.NEXTAUTH_URL + '/reviews/create?rentId=' + rent.id),
                    productName: rent.product.name
                }
            );
        }
    } catch {
        console.log("Error lors du changement du status")
    }
}

