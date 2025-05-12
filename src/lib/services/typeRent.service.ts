'use server'
import {prisma} from "@/lib/prisma";
import {TypeRent} from "@prisma/client";

export async function findTypeById(id: string): Promise<TypeRent | null> {
    try {
        return await prisma.typeRent.findUnique({
            where: {id},
        });
    } catch (error) {
        console.error("Erreur lors de la recherche du type de location:", error);
        return null;
    }
}

export async function findAllTypeRent(): Promise<TypeRent[] | null> {
    try {
        return await prisma.typeRent.findMany();
    } catch (error) {
        console.error("Erreur lors de la recherche des types de location:", error);
        return null;
    }
}
