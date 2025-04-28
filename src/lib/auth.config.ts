import Google from 'next-auth/providers/google'
import type { NextAuthConfig} from "next-auth";
import Credentials from "@auth/core/providers/credentials";

export default {
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET
        }),
    ]
} satisfies NextAuthConfig;
