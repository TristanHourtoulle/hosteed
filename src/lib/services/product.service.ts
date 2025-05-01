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

type ProductWithRelations = Prisma.ProductGetPayload<{
    include: {
        img: true;
        type: true;
        equipments: true;
        servicesList: true;
        mealsList: true;
        options: true;
    };
}>;

type ProductWithDates = Omit<ProductWithRelations, 'arriving' | 'leaving'> & {
    arriving: Date;
    leaving: Date;
};

function convertProductToDates(product: ProductWithRelations): ProductWithDates {
    return {
        ...product,
        arriving: bigIntToDate(product.arriving),
        leaving: bigIntToDate(product.leaving)
    };
}

export async function findProductById(id: string): Promise<ProductWithDates | null> {
    try {
        const product = await prisma.product.findUnique({
            where: {id},
            include: {
                img: true,
                type: true,
                equipments: true,
                servicesList: true,
                mealsList: true,
                options: true
            }
        });
        if (product) {
            return convertProductToDates(product);
        }
        return null;
    } catch (error) {
        console.error("Erreur lors de la recherche du produit:", error);
        return null;
    }
}

export async function findAllProducts(): Promise<ProductWithDates[] | null> {
    try {
        const products = await prisma.product.findMany({
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

        return products.map(convertProductToDates);
    } catch (error) {
        console.error("Erreur lors de la recherche des produits:", error);
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
    images: string[]
}): Promise<ProductWithDates | null> {
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
                arriving: dateToBigInt(params.arriving),
                leaving: dateToBigInt(params.leaving),
                autoAccept: false,
                phone: "",
                categories: BigInt(0),
                validate: false,
                userManager: BigInt(0),
                type: { connect: { id: params.typeId } },
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

        return convertProductToDates(createdProduct);
    } catch (error) {
        console.error("Erreur lors de la création du produit:", error);
        return null;
    }
}
