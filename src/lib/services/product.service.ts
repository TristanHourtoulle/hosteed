'use server'
import {prisma} from "@/lib/prisma";


export async function findProductById(id: string) {
    try {
        return await prisma.product.findUnique({
            where: { id },
            include: {
                type: true,
                equipments: true,
                servicesList: true,
                mealsList: true,
                securities: true,
                options: true,
                specificRequests: true,
                specificPrices: true,
                reviews: true,
                img: true
            }
        });
    } catch (error) {
        console.error("Erreur lors de la recherche du produit:", error);
        return null;
    }
}

// Fonction pour calculer la distance entre deux points en kilomètres
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

type ProductWithLocation = {
    id: string;
    name: string;
    description: string;
    address: string;
    longitude: number;
    latitude: number;
    type: {
        id: string;
        name: string;
        description: string;
    };
    equipments: Array<{
        id: string;
        name: string;
    }>;
    servicesList: Array<{
        id: string;
        name: string;
    }>;
    mealsList: Array<{
        id: string;
        name: string;
    }>;
    securities: Array<{
        id: string;
        name: string;
    }>;
    options: Array<{
        id: string;
        name: string;
        price: number;
        type: number;
    }>;
    specificRequests: Array<{
        id: string;
        name: string;
        text: string;
    }>;
    specificPrices: Array<{
        id: string;
        day: number;
        price: number;
        active: number;
    }>;
    reviews: Array<{
        id: string;
        title: string;
        text: string;
        grade: number;
        visitDate: Date;
        publishDate: Date;
    }>;
    img: Array<{
        id: string;
        img: string;
    }>;
};

export async function findProductAll(params?: {
        name?: string;
        description?: string;
        address?: string;
        longitude?: number;
        latitude?: number;
        basePrice?: string;
        room?: number;
        bathroom?: number;
        arriving?: number;
        leaving?: number;
        equipement?: number;
        meal?: number;
        services?: number;
        security?: number;
        minRent?: number;
        maxRent?: number;
        advanceRent?: number;
        delayTime?: number;
        phone?: string;
        categories?: number;
        minPeople?: number;
        maxPeople?: number;
        validate?: boolean;
        userManager?: number;
        typeId?: string;
        searchRadius?: number;
        centerLat?: number;
        centerLon?: number;
}) {
    try {
        console.log('findProductAll appelé avec les paramètres:', params);
        
        const where: any = {
            validate: true
        };

        if (params) {
            // Filtre par type
            if (params.typeId) {
                where.typeId = params.typeId;
                console.log('Filtre par type ajouté:', params.typeId);
            }

            // Filtre par géolocalisation si les coordonnées sont fournies
            if (params.centerLat && params.centerLon && params.searchRadius) {
                // Conversion du rayon en degrés (approximative)
                const latDegrees = params.searchRadius / 111.32;
                const lonDegrees = params.searchRadius / (111.32 * Math.cos(params.centerLat * Math.PI / 180));

                where.latitude = {
                    gte: params.centerLat - latDegrees,
                    lte: params.centerLat + latDegrees
                };
                where.longitude = {
                    gte: params.centerLon - lonDegrees,
                    lte: params.centerLon + lonDegrees
                };
                console.log('Filtre de géolocalisation ajouté:', {
                    latMin: params.centerLat - latDegrees,
                    latMax: params.centerLat + latDegrees,
                    lonMin: params.centerLon - lonDegrees,
                    lonMax: params.centerLon + lonDegrees
                });
            }
        }

        console.log('Clause WHERE construite:', where);

        const products = await prisma.product.findMany({
            where,
            include: {
                type: true,
                equipments: true,
                servicesList: true,
                mealsList: true,
                securities: true,
                options: true,
                specificRequests: true,
                specificPrices: true,
                reviews: true,
                img: true
            }
        });

        console.log('Nombre de produits trouvés:', products.length);
        if (products.length > 0) {
            console.log('Premier produit trouvé:', {
                id: products[0].id,
                name: products[0].name,
                address: products[0].address,
                latitude: products[0].latitude,
                longitude: products[0].longitude
            });
        }
        return products;
    } catch (error) {
        console.error("Erreur lors de la recherche des produits:", error);
        return null;
    }
}

export async function createProduct(data: {
    name: string;
    description: string;
    address: string;
    longitude: number;
    latitude: number;
    basePrice: string;
    room: number;
    bathroom: number;
    minPeople: number;
    maxPeople: number;
    typeId: string;
    arriving: number;
    leaving: number;
    autoAccept: boolean;
    phone: string;
    categories: number;
    validate: boolean;
    userManager: number;
    securities?: string[];
    mealsList?: string[];
    equipments?: string[];
    servicesList?: string[];
    images?: string[]; // Tableau de chaînes base64
}) {
    try {
        // Créer le produit avec les relations
        const product = await prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                address: data.address,
                longitude: data.longitude,
                latitude: data.latitude,
                basePrice: data.basePrice,
                room: BigInt(data.room),
                bathroom: BigInt(data.bathroom),
                arriving: BigInt(data.arriving),
                leaving: BigInt(data.leaving),
                autoAccept: data.autoAccept,
                phone: data.phone,
                categories: BigInt(data.categories),
                minPeople: BigInt(data.minPeople),
                maxPeople: BigInt(data.maxPeople),
                validate: data.validate,
                userManager: BigInt(data.userManager),
                type: {
                    connect: { id: data.typeId }
                },
                // Connecter les relations si elles existent
                ...(data.securities && {
                    securities: {
                        connect: data.securities.map(id => ({ id }))
                    }
                }),
                ...(data.mealsList && {
                    mealsList: {
                        connect: data.mealsList.map(id => ({ id }))
                    }
                }),
                ...(data.equipments && {
                    equipments: {
                        connect: data.equipments.map(id => ({ id }))
                    }
                }),
                ...(data.servicesList && {
                    servicesList: {
                        connect: data.servicesList.map(id => ({ id }))
                    }
                }),
                // Créer les images si elles existent
                ...(data.images && {
                    img: {
                        create: data.images.map(base64Image => ({
                            img: base64Image
                        }))
                    }
                })
            },
            include: {
                type: true,
                securities: true,
                mealsList: true,
                equipments: true,
                servicesList: true,
                img: true
            }
        });

        return product;
    } catch (error) {
        console.error("Erreur lors de la création du produit:", error);
        return null;
    }
}
