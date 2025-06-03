'use client'

import { useEffect, useState, use } from 'react'
import { findProductById, validateProduct, rejectProduct } from '@/lib/services/product.service'
import { findAllRentByProductId } from '@/lib/services/rents.service'
import { Product, RentStatus, PaymentStatus, ProductValidation } from '@prisma/client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface ProductWithRelations extends Product {
    type?: {
        id: string;
        name: string;
    } | null;
    equipments?: Array<{
        id: string;
        name: string;
    }>;
    servicesList?: Array<{
        id: string;
        name: string;
    }>;
    mealsList?: Array<{
        id: string;
        name: string;
    }>;
    img?: Array<{
        id: string;
        img: string;
    }>;
}

interface Rent {
    id: string
    arrivingDate: Date
    leavingDate: Date
    numberPeople: bigint
    status: RentStatus
    payment: PaymentStatus
    prices: bigint
    user: {
        id: string
        name: string | null
        email: string
    }
    options: {
        id: string
        name: string
        price: bigint
    }[]
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const [product, setProduct] = useState<ProductWithRelations | null>(null)
    const [rents, setRents] = useState<Rent[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const resolvedParams = use(params)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productData, rentsData] = await Promise.all([
                    findProductById(resolvedParams.id),
                    findAllRentByProductId(resolvedParams.id)
                ])

                if (productData) {
                    setProduct(productData)
                }
                if (rentsData) {
                    setRents(rentsData)
                }
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [resolvedParams.id])

    const handleValidate = async () => {
        try {
            const updatedProduct = await validateProduct(resolvedParams.id)
            if (updatedProduct) {
                setProduct(updatedProduct)
            }
        } catch (error) {
            console.error('Erreur lors de la validation du produit:', error)
        }
    }

    const handleReject = async () => {
        try {
            const updatedProduct = await rejectProduct(resolvedParams.id)
            if (updatedProduct) {
                setProduct(updatedProduct)
            }
        } catch (error) {
            console.error('Erreur lors du rejet du produit:', error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Produit non trouvé</h2>
                    <button
                        onClick={() => router.push('/admin/products')}
                        className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                    >
                        Retour à la liste
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Détails de l&apos;hébergement</h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.push('/admin/products')}
                        className="border-2 border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
                    >
                        Retour
                    </button>
                    {product.validate === ProductValidation.NotVerified && (
                        <>
                            <button
                                onClick={handleValidate}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium"
                            >
                                Valider
                            </button>
                            <button
                                onClick={handleReject}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                            >
                                Refuser
                            </button>
                        </>
                    )}
                    {product.validate === ProductValidation.Approve && (
                        <button
                            onClick={handleReject}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                        >
                            Refuser
                        </button>
                    )}
                    {product.validate === ProductValidation.Refused && (
                        <button
                            onClick={handleValidate}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium"
                        >
                            Valider
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Informations principales */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">Informations principales</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-800">Nom</h3>
                            <p className="text-gray-700">{product.name}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Description</h3>
                            <p className="text-gray-700">{product.description}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Adresse</h3>
                            <p className="text-gray-700">{product.address}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Prix de base</h3>
                            <p className="text-gray-700">{product.basePrice}€ / nuit</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Statut</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                product.validate === 'Approve' 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                                {product.validate}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Caractéristiques */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">Caractéristiques</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-800">Type d&apos;hébergement</h3>
                            <p className="text-gray-700">{product.type?.name}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Nombre de chambres</h3>
                            <p className="text-gray-700">{product.room || 'Non spécifié'}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Nombre de salles de bain</h3>
                            <p className="text-gray-700">{product.bathroom || 'Non spécifié'}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Heure d&apos;arrivée</h3>
                            <p className="text-gray-700">{product.arriving}h</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Heure de départ</h3>
                            <p className="text-gray-700">{product.leaving}h</p>
                        </div>
                    </div>
                </div>

                {/* Équipements et services */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">Équipements et services</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-800">Équipements</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {product.equipments?.map((equipment) => (
                                    <span
                                        key={equipment.id}
                                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm border border-gray-200"
                                    >
                                        {equipment.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Services</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {product.servicesList?.map((service) => (
                                    <span
                                        key={service.id}
                                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm border border-gray-200"
                                    >
                                        {service.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Repas</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {product.mealsList?.map((meal) => (
                                    <span
                                        key={meal.id}
                                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm border border-gray-200"
                                    >
                                        {meal.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">Images</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {product.img?.map((image, index) => (
                            <div key={index} className="relative h-48">
                                <Image
                                    src={image.img}
                                    alt={`Image ${index + 1} de ${product.name}`}
                                    fill
                                    className="object-cover rounded-lg"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Réservations */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 lg:col-span-2">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">Réservations</h2>
                    {rents.length === 0 ? (
                        <p className="text-gray-600">Aucune réservation pour ce produit</p>
                    ) : (
                        <div className="space-y-4">
                            {rents.map((rent) => (
                                <div key={rent.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-800">Client</h3>
                                            <p className="text-gray-700">{rent.user.name || 'Anonyme'}</p>
                                            <p className="text-gray-600 text-sm">{rent.user.email}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">Dates</h3>
                                            <p className="text-gray-700">
                                                Du {new Date(rent.arrivingDate).toLocaleDateString()} au {new Date(rent.leavingDate).toLocaleDateString()}
                                            </p>
                                            <p className="text-gray-600 text-sm">
                                                {rent.numberPeople.toString()} personne(s)
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">Options</h3>
                                            {rent.options.length > 0 ? (
                                                <ul className="list-disc list-inside text-gray-700">
                                                    {rent.options.map((option) => (
                                                        <li key={option.id}>
                                                            {option.name} - {option.price}€
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-gray-600">Aucune option</p>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">Statut</h3>
                                            <div className="flex gap-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    rent.status === RentStatus.RESERVED 
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : rent.status === RentStatus.CANCEL
                                                        ? 'bg-red-100 text-red-800 border border-red-200'
                                                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                }`}>
                                                    {rent.status}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    rent.payment === PaymentStatus.CLIENT_PAID 
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : rent.payment === PaymentStatus.REFUNDED
                                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                }`}>
                                                    {rent.payment}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 mt-2">
                                                Total: {rent.prices}€
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
