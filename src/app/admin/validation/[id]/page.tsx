'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { findProductById, validateProduct, rejectProduct } from '@/lib/services/product.service';
import { ProductValidation, RentStatus } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    description: string;
    address: string;
    basePrice: string;
    room: bigint | null;
    bathroom: bigint | null;
    arriving: number;
    leaving: number;
    validate: ProductValidation;
    img?: { img: string }[];
    user: { name: string | null; email: string }[];
    equipments: { id: string; name: string }[];
    servicesList: { id: string; name: string }[];
    mealsList: { id: string; name: string }[];
    securities: { id: string; name: string }[];
    type: { id: string; name: string; description: string };
    options: { id: string; name: string; productId: string; type: bigint; price: bigint }[];
    rents: { id: string; status: RentStatus }[];
    discount: any[];
}

export default function ValidationPreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [validationStatus, setValidationStatus] = useState<ProductValidation | null>(null);
    const resolvedParams = use(params);

    useEffect(() => {
        if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
            router.push('/');
        }
    }, [session, router]);

    const fetchProduct = async () => {
        try {
            const productData = await findProductById(resolvedParams.id);
            if (productData) {
                setProduct(productData);
                setValidationStatus(productData.validate);
            }
        } catch (err) {
            setError('Erreur lors du chargement de l\'annonce');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [resolvedParams.id]);

    const handleValidate = async () => {
        try {
            await validateProduct(resolvedParams.id);
            setValidationStatus(ProductValidation.Approve);
            router.push('/admin/validation');
        } catch (err) {
            setError('Erreur lors de la validation de l\'annonce');
            console.error(err);
        }
    };

    const handleReject = async () => {
        try {
            await rejectProduct(resolvedParams.id);
            setValidationStatus(ProductValidation.Refused);
            router.push('/admin/validation');
        } catch (err) {
            setError('Erreur lors du rejet de l\'annonce');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                        <div className="h-64 bg-gray-200 rounded mb-8"></div>
                        <div className="space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
                        <p className="text-gray-600">{error || 'Annonce non trouvée'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="relative h-96">
                        {product.img && product.img.length > 0 ? (
                            <Image
                                src={product.img[0].img}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400">Aucune image disponible</span>
                            </div>
                        )}
                    </div>

                    <div className="p-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                        
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Description</h2>
                            <p className="text-gray-600">{product.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">Adresse</h2>
                                <p className="text-gray-600">{product.address}</p>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">Prix de base</h2>
                                <p className="text-gray-600">{product.basePrice} €</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Propriétaire</h2>
                            {product.user && product.user.length > 0 ? (
                                <div className="text-gray-600">
                                    <p>Nom: {product.user[0].name}</p>
                                    <p>Email: {product.user[0].email}</p>
                                </div>
                            ) : (
                                <p className="text-gray-600">Informations du propriétaire non disponibles</p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={handleReject}
                                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Rejeter
                            </button>
                            <button
                                onClick={handleValidate}
                                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                Valider
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 