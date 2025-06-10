// TODO: refactor this file because it's larger than 200 lines
'use server'
import {prisma} from "@/lib/prisma";
import {sendTemplatedMail} from "@/lib/services/sendTemplatedMail";
import {findAllUserByRoles} from "@/lib/services/user.service";
import { ProductValidation } from "@prisma/client";

export async function findProductById(id: string) {
    try {
        const product = await prisma.product.findUnique({
            where: {id},
            include: {
                img: true,
                type: true,
                equipments: true,
                servicesList: true,
                mealsList: true,
                options: true,
                rents: true,
                discount: true,
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                securities: true,
                reviews: {
                    where: {
                        approved: true
                    },
                    select: {
                        id: true,
                        title: true,
                        text: true,
                        grade: true,
                        welcomeGrade: true,
                        staff: true,
                        comfort: true,
                        equipment: true,
                        cleaning: true,
                        visitDate: true,
                        publishDate: true,
                        approved: true
                    }
                },
            }
        });
        if (product) {
            return product;
        }
        return null;
    } catch (error) {
        console.error("Erreur lors de la recherche du produit:", error);
        return null;
    }
}

export async function findAllProducts() {
    try {
        const products = await prisma.product.findMany({
            where: {
              validate: ProductValidation.Approve
            },
            include: {
                img: true,
                type: true,
                equipments: true,
                securities: true,
                servicesList: true,
                mealsList: true,
                options: true
            }
        });

        return products;
    } catch (error) {
        console.error("Erreur lors de la recherche des produits:", error);
        return null;
    }
}

export async function findAllProductByHostId(id: string) {
    try {
        const products = await prisma.product.findMany({
            where: {
                user: {
                    some: {
                        id: {
                            equals: id
                        }
                    }
                }
            },
            include: {
                img: true,
                type: true,
                equipments: true,
                securities: true,
                servicesList: true,
                mealsList: true,
                options: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        return products;
    } catch (error) {
        console.error("Erreur lors de la recherche des produits de l'hôte:", error);
        return null;
    }
}

export async function createProduct(params: {
    name: string,
    description: string,
    address: string,
    longitude: number,
    latitude: number,
    basePrice: string,
    room: number | null,
    bathroom: number | null,
    arriving: number,
    leaving: number,
    typeId: string,
    securities: string[],
    equipments: string[],
    services: string[],
    meals: string[],
    images: string[],
    userId: string[]
}) {
    try {
        const type = await prisma.typeRent.findFirst({
            where: {
                id: params.typeId
            }
        });
        if (!type) return null;

        const createdProduct = await prisma.product.create({
            data: {
                name: params.name,
                description: params.description,
                address: params.address,
                longitude: params.longitude,
                latitude: params.latitude,
                basePrice: params.basePrice,
                room: params.room ? BigInt(params.room) : null,
                bathroom: params.bathroom ? BigInt(params.bathroom) : null,
                arriving: params.arriving,
                leaving: params.leaving,
                autoAccept: false,
                phone: "",
                categories: BigInt(0),
                validate: "NotVerified",
                userManager: BigInt(0),
                type: {connect: {id: params.typeId}},
                user: {
                    connect: params.userId.map((id) => ({id: id}))
                },
                equipments: {
                    connect: params.equipments.map(equipmentId => ({ id: equipmentId }))
                },
                servicesList: {
                    connect: params.services.map(serviceId => ({ id: serviceId }))
                },
                mealsList: {
                    connect: params.meals.map(mealId => ({ id: mealId }))
                },
                securities: {
                    connect: params.securities.map(securityId => ({ id: securityId }))
                },
                img: {
                    create: params.images.map(img => ({ img }))
                }
            },
            include: {
                img: true,
                type: true,
                equipments: true,
                servicesList: true,
                mealsList: true,
                options: true
            }
        });

        if (!createdProduct) throw Error('Erreur lors de la creation du produit')
        const admin = await findAllUserByRoles('ADMIN');
        admin?.map(async (user) => {
            await sendTemplatedMail(
                user.email,
                'Une nouvelle annonce est en attente de validation',
                'annonce-postee.html',
                {
                    name: user.name || 'Administrateur',
                    productName: params.name,
                    annonceUrl: (process.env.NEXTAUTH_URL + '/product/' + createdProduct.id),
                }
            );
        })
        return createdProduct;
    } catch (error) {
        console.error("Erreur lors de la création du produit:", error);
        return null;
    }
}

export async function findProductByValidation(validationStatus: ProductValidation) {
    try {
        const request = await prisma.product.findMany({
            where: {
                validate: validationStatus,
            },
            include: {
                img: true,
                user: true
            }
        });
        if (!request) return null;
        return request;
    } catch (e) {
        console.error("Erreur lors de la recherche des produits:", e);
        return null;
    }
}

export async function validateProduct(id: string) {
    try {
        const product = await prisma.product.update({
            where: { id },
            data: { validate: ProductValidation.Approve },
            include: {
                user: true,
                img: true,
            }
        });
        if (product) {
            if (!product.user || !Array.isArray(product.user)) {
                console.error("Les utilisateurs du produit ne sont pas disponibles");
                return null;
            }
            product.user.map(async (user) => {
                await sendTemplatedMail(
                    user.email,
                    'Votre annonce a été validée',
                    'annonce-approved.html',
                    {
                        name: user.name || '',
                        productName: product.name,
                        annonceUrl: (process.env.NEXTAUTH_URL + '/product/' + product.id),
                    }
                );
            });
        }
        return product;
    } catch (error) {
        console.error("Erreur lors de la validation du produit:", error);
        return null;
    }
}

export async function rejectProduct(id: string) {
    try {
        const product = await prisma.product.update({
            where: { id },
            data: { validate: ProductValidation.Refused },
            include: {
                user: true,
            }
        });

        if (product) {
            if (!product.user || !Array.isArray(product.user)) {
                console.error("Les utilisateurs du produit ne sont pas disponibles");
                return null;
            }
            product.user.map(async (user) => {
                await sendTemplatedMail(
                    user.email,
                    'Votre annonce a été rejetée',
                    'annonce-rejected.html',
                    {
                        productName: product.name,
                    }
                );
            });
        }

        return product;
    } catch (error) {
        console.error("Erreur lors du rejet du produit:", error);
        return null;
    }
}

export async function resubmitProductWithChange(id: string, params: {
    name: string,
    description: string,
    address: string,
    longitude: number,
    latitude: number,
    basePrice: string,
    room: number | null,
    bathroom: number | null,
    arriving: number,
    leaving: number,
    typeId: string,
    securities: string[],
    equipments: string[],
    services: string[],
    meals: string[],
    images: string[],
}) {
    try {
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name: params.name,
                description: params.description,
                address: params.address,
                longitude: params.longitude,
                latitude: params.latitude,
                basePrice: params.basePrice,
                room: params.room ? BigInt(params.room) : null,
                bathroom: params.bathroom ? BigInt(params.bathroom) : null,
                arriving: params.arriving,
                leaving: params.leaving,
                validate: ProductValidation.RecheckRequest,
                type: { connect: { id: params.typeId } },
                equipments: {
                    set: params.equipments.map(equipmentId => ({ id: equipmentId }))
                },
                servicesList: {
                    set: params.services.map(serviceId => ({ id: serviceId }))
                },
                mealsList: {
                    set: params.meals.map(mealId => ({ id: mealId }))
                },
                securities: {
                    set: params.securities.map(securityId => ({ id: securityId }))
                },
                img: {
                    deleteMany: {},
                    create: params.images.map(img => ({ img }))
                }
            },
            include: {
                img: true,
                type: true,
                equipments: true,
                servicesList: true,
                mealsList: true,
                options: true,
                user: true
            }
        });

        if (updatedProduct) {
            // Notifier les administrateurs
            const admin = await findAllUserByRoles('ADMIN');
            admin?.forEach(async (user) => {
                await sendTemplatedMail(
                    user.email,
                    'Une annonce a été modifiée et nécessite une nouvelle validation',
                    'annonce-modifiee.html',
                    {
                        name: user.name || 'Administrateur',
                        productName: params.name,
                        annonceUrl: (process.env.NEXTAUTH_URL + '/admin/validation/' + updatedProduct.id),
                    }
                );
            });
        }

        return updatedProduct;
    } catch (error) {
        console.error("Erreur lors de la mise à jour du produit:", error);
        return null;
    }
}

