'use client'
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { findAllRentByUserId, cancelRent } from '@/lib/services/rents.service';
import { findProductById } from '@/lib/services/product.service';
import Image from 'next/image';
import Link from 'next/link';
import {PaymentStatus, RentStatus} from "@prisma/client";

interface Rent {
    id: string;
    productId: string;
    arrivingDate: Date;
    leavingDate: Date;
    numberPeople: bigint;
    accepted: boolean;
    options?: {
        id: string;
        name: string;
        price: number;
    }[];
    product?: {
        name: string;
        img?: { img: string }[];
    };
    status: RentStatus;
    payment: PaymentStatus;

}

export default function ReservationsPage() {
    const { data: session } = useSession();
    const [rents, setRents] = useState<Rent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRents = async () => {
            if (!session?.user?.id) return;

            try {
                setLoading(true);
                const userRents = await findAllRentByUserId(session.user.id);
                console.log(userRents)

                if (userRents) {
                    // Récupérer les détails des produits pour chaque réservation
                    const rentsWithProducts = await Promise.all(
                        userRents.map(async (rent) => {
                            const product = await findProductById(rent.productId);
                            return {
                                ...rent,
                                arrivingDate: new Date(Number(rent.arrivingDate)),
                                leavingDate: new Date(Number(rent.leavingDate)),
                                options: [], // Initialiser avec un tableau vide car le type attendu est un tableau
                                product: product || undefined
                            };
                        })
                    );
                    setRents(rentsWithProducts);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des réservations:', error);
                setError('Une erreur est survenue lors de la récupération de vos réservations');
            } finally {
                setLoading(false);
            }
        };

        fetchRents();
    }, [session]);

    if (!session) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-600">Veuillez vous connecter pour voir vos réservations</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-600">Chargement de vos réservations...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes réservations</h1>

                {rents.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Vous n&apos;avez pas encore de réservations</p>
                        <Link
                            href="/search"
                            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Trouver un hébergement
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rents.map((rent, index) => (
                            <div key={`${rent.id}-${index}`} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="relative h-48 w-full">
                                    {rent.product?.img && rent.product.img.length > 0 ? (
                                        <Image
                                            key={`${rent.id}-image`}
                                            src={rent.product.img[0].img}
                                            alt={rent.product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                                            <span className="text-gray-500">Aucune image</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {rent.product?.name || 'Hébergement non trouvé'}
                                    </h3>

                                    <div className="space-y-2 text-gray-600">
                                        <p>
                                            <span className="font-medium">Date d&apos;arrivée:</span>{' '}
                                            {new Date(rent.arrivingDate).toLocaleDateString()}
                                        </p>
                                        <p>
                                            <span className="font-medium">Date de départ:</span>{' '}
                                            {new Date(rent.leavingDate).toLocaleDateString()}
                                        </p>
                                        <p>
                                            <span className="font-medium">Nombre de personnes:</span>{' '}
                                            {rent.numberPeople ? rent.numberPeople.toString() : 'Non spécifié'}
                                        </p>

                                        {rent.options && rent.options.length > 0 && (
                                            <div className="mt-2">
                                                <p className="font-medium">Options choisies:</p>
                                                <ul className="list-disc list-inside mt-1">
                                                    {rent.options.map((option) => (
                                                        <li key={`${rent.id}-option-${option.id}`} className="text-sm">
                                                            {option.name} - {option.price}€
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                            rent.accepted 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {rent.payment == 'DISPUTE' ? 'LITIGE' : rent.status}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/product/${rent.productId}`}
                                        className="mt-4 inline-block text-blue-600 hover:text-blue-800"
                                    >
                                        Voir l&apos;hébergement
                                    </Link>
                                    {rent.status == 'RESERVED' ? (
                                    <button onClick={() => cancelRent(rent.id)}>Annuler votre reservation</button>
                                    ) : null}
                                </div>
                                {rent.status == "CHECKOUT" ? (
                                    <Link
                                        href={`/reviews/create?rentId=${rent.id}`}
                                        className="mt-4 inline-block text-blue-600 hover:text-blue-800"
                                    >
                                        Mettre un avis
                                    </Link>
                                ): null}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
