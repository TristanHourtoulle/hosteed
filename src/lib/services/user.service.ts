import bcrypt from "bcryptjs";

export class UserService {
    static async findUserByEmail(email: string) {
        try {
            const response = await fetch('/api/auth/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            
            if (!response.ok) return null;
            return await response.json();
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
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) return null;
            return await response.json();
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
            const response = await fetch(`/api/auth/user/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
            return null;
        }
    }
} 