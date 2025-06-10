// TODO: refactor this file because it's larger than 200 lines
'use client'
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckRentIsAvailable } from '@/lib/services/rents.service';
import {findProductById} from "@/lib/services/product.service";
import { PaymentForm } from '@/components/PaymentForm';

interface Option {
    id: string;
    name: string;
    price: bigint;
    type: bigint;
}

interface Product {
    id: string;
    name: string;
    basePrice: string;
    options: Option[];
    commission: number;
    arriving: number;
    leaving: number;
    img?: {
        img: string;
    }[];
}

export default function ReservationPage() {
    const { id } = useParams();
    const { data: session } = useSession();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [isAvailable, setIsAvailable] = useState<boolean>(true);
    const [formData, setFormData] = useState({
        peopleNumber: 1,
        arrivingDate: '',
        leavingDate: '',
    });
    const [showPayment] = useState(false);
    const [totalAmount] = useState<number>(0);

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const productData = await findProductById(id as string);
                if (productData) {
                    setProduct(productData);
                } else {
                    setError('Produit non trouvé');
                }
            } catch (error) {
                setError('Erreur lors de la récupération du produit'+ error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    useEffect(() => {
        const checkAvailability = async () => {
            if (formData.arrivingDate && formData.leavingDate) {
                const arrivingDate = new Date(formData.arrivingDate);
                const leavingDate = new Date(formData.leavingDate);

                // Définir les heures d'arrivée et de départ selon les heures du produit
                arrivingDate.setHours(Number(product?.arriving) || 0, 0, 0, 0);
                leavingDate.setHours(Number(product?.leaving) || 0, 0, 0, 0);

                const available = await CheckRentIsAvailable(
                    id as string,
                    arrivingDate,
                    leavingDate
                );
                setIsAvailable(available.available);
            } else {
                setIsAvailable(true); // Réinitialiser l'état si une des dates est vide
            }
        };

        checkAvailability();
    }, [formData.arrivingDate, formData.leavingDate, id, product?.arriving, product?.leaving]);

    const handleOptionChange = (optionId: string) => {
        setSelectedOptions(prev =>
            prev.includes(optionId)
                ? prev.filter(id => id !== optionId)
                : [...prev, optionId]
        );
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (!product) return;

        if (name === 'arrivingDate') {
            if (formData.leavingDate && value > formData.leavingDate) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    leavingDate: ''
                }));
                setIsAvailable(true); // Réinitialiser l'état de disponibilité
                setError('La date de départ doit être après la date d\'arrivée');
                return;
            }
        }

        if (name === 'leavingDate' && value <= formData.arrivingDate) {
            setError('La date de départ doit être après la date d\'arrivée');
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const calculateNights = () => {
        if (!formData.arrivingDate || !formData.leavingDate) return 0;

        const arrivingDate = new Date(formData.arrivingDate);
        const leavingDate = new Date(formData.leavingDate);

        // S'assurer que les dates sont au même moment de la journée pour un calcul précis
        arrivingDate.setHours(0, 0, 0, 0);
        leavingDate.setHours(0, 0, 0, 0);

        const diffTime = leavingDate.getTime() - arrivingDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    };

    const calculateTotalPrice = () => {
        if (!formData.arrivingDate || !formData.leavingDate || !product) return BigInt(0);

        const nights = calculateNights();
        if (nights <= 0) return BigInt(0);
        const basePrice = BigInt(product.basePrice) * BigInt(nights);
        const optionsPrice = product.options
            .filter(option => selectedOptions.includes(option.id))
            .reduce((sum, option) => sum + option.price, BigInt(0));
        const totalBeforeCommission = basePrice + optionsPrice;
        const commission = (totalBeforeCommission * BigInt(product.commission)) / BigInt(100);
        return totalBeforeCommission + commission;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id) {
            setError('Vous devez être connecté pour effectuer une réservation');
            return;
        }

        if (!product) {
            setError('Impossible de trouver les informations du produit');
            return;
        }

        try {
            const isAvailable = await CheckRentIsAvailable(
                id as string,
                new Date(formData.arrivingDate),
                new Date(formData.leavingDate)
            );

            if (!isAvailable) {
                setError('Les dates sélectionnées ne sont pas disponibles');
                return;
            }

            // Calculer le montant total
            const total = Number(calculateTotalPrice());

            // Créer la session de paiement Stripe
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: total,
                    productName: product.name,
                    metadata: {
                        productId: id,
                        userId: session.user.id,
                        userEmail: session.user.email,
                        productName: product.name,
                        arrivingDate: formData.arrivingDate,
                        leavingDate: formData.leavingDate,
                        peopleNumber: formData.peopleNumber,
                        options: selectedOptions,
                        prices: total,
                    },
                }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setError('Erreur lors de la création de la session de paiement');
            }
        } catch {
            setError('Une erreur est survenue lors de la vérification de disponibilité');
        }
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
            <div className="text-red-500">{error}</div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Impossible de charger les informations de l&apos;hébergement</p>
            </div>
        );
    }

    if (showPayment) {
        return (
            <div className="max-w-2xl mx-auto p-4">
                <h2 className="text-2xl font-bold mb-4">Paiement de votre réservation</h2>
                <p className="mb-4">Montant total : {totalAmount}€</p>
                <PaymentForm
                    amount={totalAmount}
                    onError={(error) => setError(error.message)}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Réserver {product?.name || 'Hébergement'}
                </h1>

                {!product ? (
                    <div className="text-center py-12">
                        <p className="text-red-600">Impossible de charger les informations de l&apos;hébergement</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="peopleNumber" className="block text-sm font-medium text-gray-700">
                                        Nombre de personnes
                                    </label>
                                    <input
                                        type="number"
                                        id="peopleNumber"
                                        min="1"
                                        value={formData.peopleNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, peopleNumber: parseInt(e.target.value) }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>

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
                                        required
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
                                        required
                                        disabled={!formData.arrivingDate}
                                    />
                                    {!formData.arrivingDate && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Veuillez d&apos;abord sélectionner une date d&apos;arrivée
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Options disponibles</h3>
                                    <div className="space-y-4">
                                        {product.options.map((option) => (
                                            <div key={option.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`option-${option.id}`}
                                                    checked={selectedOptions.includes(option.id)}
                                                    onChange={() => handleOptionChange(option.id)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor={`option-${option.id}`} className="ml-3">
                                                    <span className="text-gray-900">{option.name}</span>
                                                    <span className="text-gray-500 ml-2">+{option.price}€</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!isAvailable || !formData.arrivingDate || !formData.leavingDate}
                                    className={`w-full py-2 px-4 rounded-md transition-colors duration-200 ${
                                        !isAvailable || !formData.arrivingDate || !formData.leavingDate
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    } text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                >
                                    {!formData.arrivingDate || !formData.leavingDate
                                        ? 'Sélectionnez des dates'
                                        : !isAvailable
                                            ? 'Non disponible pour ces dates'
                                            : 'Confirmer la réservation'
                                    }
                                </button>

                                {!isAvailable && formData.arrivingDate && formData.leavingDate && (
                                    <p className="text-red-600 text-sm mt-2">
                                        Ce logement n&apos;est pas disponible pour les dates sélectionnées.
                                    </p>
                                )}
                            </form>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Prix par nuit</span>
                                    <span className="font-medium">{product.basePrice}€</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Nombre de nuits</span>
                                    <span className="font-medium">{calculateNights()}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Prix total hébergement</span>
                                    <span className="font-medium">
                                        {formData.arrivingDate && formData.leavingDate
                                            ? (BigInt(product.basePrice) * BigInt(calculateNights())).toString() + '€'
                                            : '0€'}
                                    </span>
                                </div>

                                {selectedOptions.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Options sélectionnées</h4>
                                        <div className="space-y-2">
                                            {product.options
                                                .filter(option => selectedOptions.includes(option.id))
                                                .map(option => (
                                                    <div key={option.id} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{option.name}</span>
                                                        <span>+{option.price.toString()}€</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <div className="flex justify-between font-medium">
                                        <span>Total</span>
                                        <span>
                                            {calculateTotalPrice().toString()}€
                                        </span>
                                    </div>
                                </div>
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Frais supplémentaires</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Commission ({product.commission}%)</span>
                                            <span>+{((BigInt(product.basePrice) * BigInt(calculateNights()) + product.options
                                                .filter(option => selectedOptions.includes(option.id))
                                                .reduce((sum, option) => sum + option.price, BigInt(0))) * BigInt(product.commission) / BigInt(100)).toString()}€</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
