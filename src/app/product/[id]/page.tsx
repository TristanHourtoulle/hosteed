'use client'
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { findProductById } from '@/lib/services/product.service';
import { CheckRentIsAvailable } from '@/lib/services/rents.service';
import Image from 'next/image';
import Link from 'next/link';
import {Equipment, Meals, Services} from "@prisma/client";

interface Reviews {
    id: string;
    title: string;
    productId: string;
    text: string;
    grade: number;
    visitDate: Date;
    publishDate: Date;
    rentId: string;
}
interface Product {
    id: string;
    name: string;
    description: string;
    basePrice: string;
    equipments: Equipment[];
    servicesList: Services[];
    mealsList: Meals[];
    reviews: Reviews[];
    img: { img: string }[];
}

export default function ProductDetails() {
    const { id } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState<boolean>(true);
    const [globalGrade, setglobalGrade] = useState<number>(0);
    const [formData, setFormData] = useState({
        arrivingDate: '',
        leavingDate: '',
    });

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    useEffect(() => {
    function getGlobalGrade (reviews: Reviews[]) {
        if (!reviews) return 0;
        let grade = 0;
        let index = 0;
        reviews.map((review) => {
            grade += review.grade;
            index += 1;
        });
        setglobalGrade(grade/index);
    }
    if (product?.reviews) getGlobalGrade(product.reviews)
    }, [product]);
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const productData = await findProductById(id as string);
                if (productData) {
                    console.log(productData)
                    setProduct(productData);
                } else {
                    setError('Produit non trouvé');
                }
            } catch (error) {
                setError('Erreur lors de la récupération du produit' + error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    useEffect(() => {
        const checkAvailability = async () => {
            if (formData.arrivingDate && formData.leavingDate) {
                const available = await CheckRentIsAvailable(
                    id as string,
                    new Date(formData.arrivingDate),
                    new Date(formData.leavingDate)
                );
                setIsAvailable(available);
            }
        };

        checkAvailability();
    }, [formData.arrivingDate, formData.leavingDate, id]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'arrivingDate') {
            if (formData.leavingDate && value > formData.leavingDate) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    leavingDate: ''
                }));
                return;
            }
        }

        if (name === 'leavingDate' && value <= formData.arrivingDate) {
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-600">Chargement...</p>
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

    if (!product) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-600">Produit non trouvé</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">{product.name}</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="relative h-96 w-full mb-6">
                            {product.img && product.img.length > 0 ? (
                                <Image
                                    src={product.img[0].img}
                                    alt={product.name}
                                    fill
                                    className="object-cover rounded-lg"
                                />
                            ) : (
                                <div className="bg-gray-200 h-full w-full flex items-center justify-center rounded-lg">
                                    <span className="text-gray-500">Aucune image</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Description</h2>
                                <p className="text-gray-700">{product.description}</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">Équipements</h2>
                                    <ul className="space-y-2 text-gray-700">
                                        {product.equipments?.map((equipment: Equipment) => (
                                            <li key={equipment.id}>{equipment.name}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">Services</h2>
                                    <ul className="space-y-2 text-gray-700">
                                        {product.servicesList?.map((service: Services) => (
                                            <li key={service.id}>{service.name}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h2 className="text-2xl font-semibold mb-4 text-gray-900">Repas</h2>
                                    <ul className="space-y-2 text-gray-700">
                                        {product.mealsList?.map((meal: Meals) => (
                                            <li key={meal.id}>{meal.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-900">Réserver</h2>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="arrivingDate" className="block text-sm font-medium text-gray-700">
                                    Date d&apos;arrivée
                                </label>
                                <input
                                    type="date"
                                    id="arrivingDate"
                                    name="arrivingDate"
                                    value={formData.arrivingDate}
                                    min={today}
                                    onChange={handleDateChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="leavingDate" className="block text-sm font-medium text-gray-700">
                                    Date de départ
                                </label>
                                <input
                                    type="date"
                                    id="leavingDate"
                                    name="leavingDate"
                                    value={formData.leavingDate}
                                    min={formData.arrivingDate || tomorrow}
                                    onChange={handleDateChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    disabled={!formData.arrivingDate}
                                />
                                {!formData.arrivingDate && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Veuillez d&apos;abord sélectionner une date d&apos;arrivée
                                    </p>
                                )}
                            </div>

                            {!isAvailable && formData.arrivingDate && formData.leavingDate && (
                                <p className="text-red-600 text-sm">
                                    Ce logement n&apos;est pas disponible pour les dates sélectionnées.
                                </p>
                            )}

                            <div className="pt-4">
                                <Link
                                    href={`/product/${id}/reservation`}
                                    className={`w-full block text-center py-3 px-6 rounded-lg transition-colors duration-200 ${
                                        !isAvailable || !formData.arrivingDate || !formData.leavingDate
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    } text-white font-bold`}
                                    onClick={(e) => {
                                        if (!isAvailable || !formData.arrivingDate || !formData.leavingDate) {
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    {!formData.arrivingDate || !formData.leavingDate
                                        ? 'Sélectionnez des dates'
                                        : !isAvailable
                                            ? 'Non disponible pour ces dates'
                                            : 'Réserver maintenant'
                                    }
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-2xl font-semibold mb-4 text-gray-900">
                    <h1>Reviews</h1>
                    <div>
                        <h1>Note: {globalGrade}</h1>
                    </div>

                    <div>
                        <p>Avis:</p>
                        {product.reviews && product.reviews.map((review) => (
                            <div key={review.id}>
                                <p>Note: {review.grade}</p>
                                <p>Avis: {review.title}</p>
                                <p>{review.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
