import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export class TypeRentService {
    static async findTypRentById(id: string) {
        try {
            const typeRent = await prisma.typeRent.findUnique({
                where: { id },
            });
            return typeRent;
        } catch (error) {
            console.error("Erreur lors de la recherche du type de location:", error);
            return null;
        }
    }

    static async createTypeRent(data: {
        email: string;
        password: string;
        name?: string;
        lastname?: string;
    }) {
        try {
        } catch (error) {
            console.error("Erreur lors de la création de l'utilisateur:", error);
            return null;
        }
    }

    static async updateRent(id: string, data: Partial<{
        email: string;
        password: string;
        name: string;
        lastname: string;
        emailVerified: Date;
    }>) {
        try {
            const updateData = { ...data };
            if (data.password) {
                updateData.password = await bcrypt.hash(data.password, 10);
            }

            const user = await prisma.user.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    lastname: true,
                    emailVerified: true
                }
            });
            return user;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
            return null;
        }
    }
}
