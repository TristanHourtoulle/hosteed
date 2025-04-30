import {UserRole} from "@prisma/client";

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string;
            email: string;
            emailVerified: Date | null;
            name: string;
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
