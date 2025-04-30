'use server'
import {prisma} from "@/lib/prisma";


export async function findTypeById(id: string) {
    try {
        return await prisma.typeRent.findUnique({
            where: {id},
        });
    } catch (error) {
        console.error("Erreur lors de la recherche de l'utilisateur:", error);
        return null;
    }
}

export async function findAllTypeRent() {
    try {
        return await prisma.typeRent.findMany();
    } catch (error) {
        console.error("Erreur lors de la recherche de l'utilisateur:", error);
        return null;
    }
}
