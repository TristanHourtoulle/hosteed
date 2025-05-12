'use server'
import {prisma} from "@/lib/prisma";

export async function findAllOptionsByProductId(id: string) {
    try {
        return await prisma.options.findMany({
            where: {
                productId: id,
            }
        });
    } catch (error) {
        console.error("Erreur lors de la recherche du type de location:", error);
        return null;
    }
}
