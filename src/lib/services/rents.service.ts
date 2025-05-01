'use server'
import {prisma} from "@/lib/prisma";

export async function findTypeById(id: string) {
    try {
        return await prisma.typeRent.findUnique({
            where: {id},
        });
    } catch (error) {
        console.error("Erreur lors de la recherche du type de location:", error);
        return null;
    }
}
