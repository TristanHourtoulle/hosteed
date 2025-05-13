'use server'
import bcrypt from "bcryptjs";
import {prisma} from "@/lib/prisma";
import {UserRole} from "@prisma/client";

export async function findAllUser() {
    try {
        return await prisma.user.findMany({
            include: {
                Rent: true,
                Product: true,
            },
            omit: {
                password: true,
                stripeCustomerId: true,
            },
        });
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function findUserById(id: string) {
    try {
        return await prisma.user.findUnique({
            where: {id},
            include: {
                Rent: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                basePrice: true,
                                validate: true
                            }
                        }
                    }
                },
                Product: true,
            },
            omit: {
                password: true,
                stripeCustomerId: true,
            },
        })
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function findUserByEmail(email: string) {
    try {
        return await prisma.user.findUnique({
            where: {email},
        });
    } catch (error) {
        console.error("Erreur lors de la recherche de l'utilisateur:", error);
        return null;
    }
}

export async function findAllUserByRoles(roles: UserRole) {
    try {
        return await prisma.user.findMany({
            where: {
                roles: roles,
            },
        });
    } catch (error) {
        console.error("Erreur lors de la recherche de l'utilisateur:", error);
        return null;
    }
}

export async function verifyPassword(password: string, hashedPassword: string) {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        console.error("Erreur lors de la vérification du mot de passe:", error);
        return false;
    }
}

export async function createUser(data: {
    email: string;
    password: string;
    name?: string;
    lastname?: string;
}) {
    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return await prisma.user.create({
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
    } catch (error) {
        console.error("Erreur lors de la création de l'utilisateur:", error);
        return null;
    }
}

export async function updateUser(id: string, data: Partial<{
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

        return await prisma.user.update({
            where: {id},
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                lastname: true,
                emailVerified: true
            }
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
        return null;
    }
}
