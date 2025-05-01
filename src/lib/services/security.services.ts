'use server'
import {prisma} from "@/lib/prisma";

export async function findAllSecurity() {
    try {
        return await prisma.security.findMany();
    } catch (error) {
        console.error("Erreur lors de la recherche des options sécurité:", error);
        return null;
    }
}
