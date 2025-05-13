'use client'

import { useEffect, useState } from 'react'
import { findUserById } from '@/lib/services/user.service'
import { useParams, useRouter } from 'next/navigation'
import { getRentById, cancelRent } from '@/lib/services/rents.service'
import Link from 'next/link'

export default function UserDetailsPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState<string | null>(null)
    const params = useParams()
    const router = useRouter()

    useEffect(() => {
        const fetchUser = async () => {
            try {
                if (params.id) {
                    const data = await findUserById(params.id as string)
                    if (data) {
                        setUser(data)
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement de l\'utilisateur:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUser()
    }, [params.id])

    const handleCancelRent = async (rentId: string) => {
        try {
            setCancelling(rentId)
            await cancelRent(rentId)
            // Rafraîchir les données après l'annulation
            const data = await findUserById(params.id as string)
            if (data) {
                setUser(data)
            }
        } catch (error) {
            console.error('Erreur lors de l\'annulation de la réservation:', error)
        } finally {
            setCancelling(null)
        }
    }

    const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return '-'
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        } catch (error) {
            console.error('Erreur de formatage de date:', error)
            return '-'
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[200px] text-lg text-gray-600">
                Chargement...
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center h-[200px] text-lg text-red-600">
                Utilisateur non trouvé
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Informations de l'utilisateur */}
            <div className="bg-white rounded-lg shadow-md mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-800">Informations de l'utilisateur</h1>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Nom</p>
                            <p className="text-lg">{user.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Prénom</p>
                            <p className="text-lg">{user.lastname || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-lg">{user.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Rôle</p>
                            <p className="text-lg">{user.roles}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Date de création</p>
                            <p className="text-lg">{formatDate(user.createdAt)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Réservations */}
            <div className="bg-white rounded-lg shadow-md mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Réservations</h2>
                </div>
                <div className="p-6">
                    {user.Rent && user.Rent.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de début</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de fin</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {user.Rent.map((rent: any) => (
                                        <tr key={rent.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rent.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {rent.product?.name || 'Produit inconnu'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(rent.arrivingDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(rent.leavingDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rent.status}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex space-x-2">
                                                    <Link
                                                        href={`/admin/reservations/${rent.id}`}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        Voir détails
                                                    </Link>
                                                    {rent.status === 'RESERVED' && (
                                                        <button
                                                            onClick={() => handleCancelRent(rent.id)}
                                                            disabled={cancelling === rent.id}
                                                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                                        >
                                                            {cancelling === rent.id ? 'Annulation...' : 'Annuler'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">Aucune réservation</p>
                    )}
                </div>
            </div>

            {/* Produits */}
            <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Produits</h2>
                </div>
                <div className="p-6">
                    {user.Product && user.Product.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix / nuit</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {user.Product.map((product: any) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.basePrice}€</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.accepted ? 'Validé' : 'En attente'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">Aucun produit</p>
                    )}
                </div>
            </div>
        </div>
    )
}
