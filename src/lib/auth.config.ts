import Google from 'next-auth/providers/google'
import type { NextAuthConfig} from "next-auth";
import Credentials from "next-auth/providers/credentials"
import { signInSchema } from "@/lib/zod/auth.schema";
import { findUserByEmail, verifyPassword} from "@/lib/services/user.service";
import { UserRole} from "@prisma/client";
import {UserInterface} from "@/lib/interface/userInterface";
import {prisma} from "@/lib/prisma";
import {stripe} from "./stripe"

export default {
    secret: process.env.AUTH_SECRET,
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET
        }),
        Credentials({
            name: "Authentification par mot de passe",
            credentials: {
                email: { label: "Adresse Mail", type: "text", placeholder: "firequiz@firequiz.fr" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                try {
                    const { email, password } = await signInSchema.parseAsync(credentials);
                    const user = await findUserByEmail(email);
                    if (!user) return null;
                    const isPasswordValid = await verifyPassword(password, user.password || "");
                    if (!isPasswordValid) return null;
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name || "",
                        lastName: user.lastname || "",
                        emailVerified: user.emailVerified,
                        image: user.image || null,
                        password: user.password || null,
                        roles: user.roles
                    };
                } catch (error) {
                    console.error("Erreur d'authentification:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = (user as UserInterface).roles as UserRole;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user = {
                    id: token.id as string,
                    email: token.email as string,
                    name: token.name as string,
                    roles: token.role as UserRole,
                    emailVerified: token.emailVerified as Date | null
                };
            }
            return session;
        }
    },
    events: {
        createUser: async (message) => {
            const userId = message.user.id;
            const email = message.user.email;
            const name = message.user.name;
            if (!userId || !email) {
                return;
            }
            const stripeCustomer = await stripe.customers.create({
                email,
                name: name ?? undefined
            })
            await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    stripeCustomerId: stripeCustomer.id
                }
            })
        }
    }
} satisfies NextAuthConfig;
