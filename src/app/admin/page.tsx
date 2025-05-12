'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
            router.push('/');
        }
    }, [session, router]);

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Administrateur</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Carte des annonces en attente */}
                    <Link href="/admin/validation" className="block">
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Validation des annonces</h2>
                            <p className="text-gray-600">Gérer les annonces en attente de validation</p>
                        </div>
                    </Link>

                    {/* Carte des utilisateurs */}
                    <Link href="/admin/users" className="block">
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Gestion des utilisateurs</h2>
                            <p className="text-gray-600">Gérer les utilisateurs et leurs rôles</p>
                        </div>
                    </Link>

                    {/* Carte des statistiques */}
                    <Link href="/admin/stats" className="block">
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Statistiques</h2>
                            <p className="text-gray-600">Voir les statistiques du site</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
