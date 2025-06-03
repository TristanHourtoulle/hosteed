'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {findProductByValidation, rejectProduct, validateProduct} from '@/lib/services/product.service';
import { ProductValidation, UserRole } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    description: string;
    address: string;
    basePrice: string;
    validate: ProductValidation;
    img?: { img: string }[];
    user: {
        id: string;
        email: string;
        name: string | null;
        lastname: string | null;
        image: string | null;
        info: string | null;
        emailVerified: Date | null;
        password: string | null;
        roles: UserRole;
        createdAt: Date;
        updatedAt: Date;
        profilePicture: string | null;
        stripeCustomerId: string | null;
    }[];
}

export default function ValidationPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [validatingId, setValidatingId] = useState<string | null>(null);

    useEffect(() => {
        if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
            router.push('/');
        }
    }, [session, router]);

    const fetchProducts = async () => {
        try {
            const unvalidatedProducts = await findProductByValidation(ProductValidation.NotVerified);
            const recheck = await findProductByValidation(ProductValidation.RecheckRequest);
            if (unvalidatedProducts && recheck) {
                setProducts([...unvalidatedProducts, ...recheck]);
            }
        } catch (err) {
            setError('Erreur lors du chargement des annonces');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleValidate = async (productId: string) => {
        setValidatingId(productId);
        try {
            const validated = await validateProduct(productId);
            if (validated) {
                setProducts(products.filter(p => p.id !== productId));
            } else {
                setError('Erreur lors de la validation de l\'annonce');
            }
        } catch (err) {
            setError('Erreur lors de la validation de l\'annonce');
            console.error(err);
        } finally {
            setValidatingId(null);
        }
    };


    const handleRefuse = async (productId: string) => {
        setValidatingId(productId);
        try {
            const rejected = await rejectProduct(productId);
            if (rejected) {
                setProducts(products.filter(p => p.id !== productId));
            } else {
                setError('Erreur lors de la validation de l\'annonce');
            }
        } catch (err) {
            setError('Erreur lors de la validation de l\'annonce');
            console.error(err);
        } finally {
            setValidatingId(null);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Validation des annonces</h1>
                    <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                        Retour au dashboard
                    </Link>
                </div>

                {products.length === 0 ? (
                    <p className="text-gray-600">Aucune annonce en attente de validation</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                {product.img && product.img[0] && (
                                    <div className="relative h-48 w-full">
                                        <Image
                                            src={product.img[0].img}
                                            alt={product.name || 'Image du produit'}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h2>
                                    <p className="text-gray-600 mb-2">{product.address}</p>
                                    <p className="text-gray-600 mb-2">{product.basePrice}€</p>
                                    <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                                    <div className="flex justify-between items-center">
                                        <Link
                                            href={`/admin/validation/${product.id}`}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            Voir les détails
                                        </Link>
                                        <button
                                            onClick={() => handleValidate(product.id)}
                                            disabled={validatingId === product.id}
                                            className={`px-4 py-2 rounded ${
                                                validatingId === product.id
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-green-500 hover:bg-green-600'
                                            } text-white`}
                                        >
                                            {validatingId === product.id ? 'Validation...' : 'Valider'}
                                        </button>
                                        <button
                                            onClick={() => handleRefuse(product.id)}
                                            disabled={validatingId === product.id}
                                            className={`px-4 py-2 rounded ${
                                                validatingId === product.id
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-red-500 hover:bg-red-600'
                                            } text-white`}
                                        >
                                            {validatingId === product.id ? 'Refuser...' : 'Refuser'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
