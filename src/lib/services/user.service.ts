import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export class UserService {

    static async findUserByEmail(email: string) {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
            });
            return user;
        } catch (error) {
            console.error("Erreur lors de la recherche de l'utilisateur:", error);
            return null;
        }
    }

    static async verifyPassword(password: string, hashedPassword: string) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            console.error("Erreur lors de la vérification du mot de passe:", error);
            return false;
        }
    }

    static async createUser(data: {
        email: string;
        password: string;
        name?: string;
        lastname?: string;
    }) {
        try {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            const user = await prisma.user.create({
                data: {
                    ...data,
                    password: hashedPassword,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    lastname: true
                }
            });
            return user;
        } catch (error) {
            console.error("Erreur lors de la création de l'utilisateur:", error);
            return null;
        }
    }

    static async updateUser(id: string, data: Partial<{
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
