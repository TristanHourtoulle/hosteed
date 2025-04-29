import Google from 'next-auth/providers/google'
import type { NextAuthConfig} from "next-auth";
import Credentials from "next-auth/providers/credentials"
import { UserService } from "@/lib/services/user.service";
import { signInSchema } from "@/lib/zod/auth.schema";

export default {
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
                    const user = await UserService.findUserByEmail(email);
                    if (!user) return null;
                    const isPasswordValid = await UserService.verifyPassword(password, user.password || "");
                    if (!isPasswordValid) return null;
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name || "",
                        lastname: user.lastname || "",
                        emailVerified: user.emailVerified,
                        image: user.image || null
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
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user = {
                    id: token.id as string,
                    email: token.email as string,
                    name: token.name as string,
                    emailVerified: token.emailVerified as Date | null
                };
            }
            return session;
        }
    }
} satisfies NextAuthConfig;
