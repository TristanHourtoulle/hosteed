import NextAuth from "next-auth"
import {UserRole} from "@prisma/client";

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            name: string;
            lastname: string;
            roles: UserRole
        }
    }

    interface User {
        roles: UserRole
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: UserRole
    }
}
