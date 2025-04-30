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
            const hashedPassword = await bcrypt.hash(data.password, 10);
            const newTypeRent = await prisma.typeRent.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: data.name,
                    lastname: data.lastname,
                },
            });
            return newTypeRent;
        } catch (error) {
            console.error("Erreur lors de la création du type de location:", error);
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

            const typeRent = await prisma.typeRent.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            return typeRent;
        } catch (error) {
            console.error("Erreur lors de la mise à jour du type de location:", error);
            return null;
        }
    }
}
