'use client'

import { useEffect, useState } from 'react'
import { findAllProducts } from '@/lib/services/product.service'
import { Product } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await findAllProducts()
                if (data) {
                    setProducts(data)
                }
            } catch (error) {
                console.error('Erreur lors du chargement des produits:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Gestion des Hébergements</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                        {product.img && product.img[0] && (
                            <div className="relative h-48 w-full">
                                <Image
                                    src={product.img[0].img}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-xl font-semibold">{product.name}</h2>
                                <span className={`px-2 py-1 rounded-full text-sm ${
                                    product.validate === 'Approve' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {product.validate}
                                </span>
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-primary font-bold">
                                    {product.basePrice}€ / nuit
                                </span>
                                <span className="text-sm text-gray-500">
                                    {product.room} chambres
                                </span>
                            </div>
                            <Link 
                                href={`/admin/products/${product.id}`}
                                className="block w-full bg-primary text-white text-center py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
                            >
                                Voir détails
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {products.length === 0 && (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <p className="text-gray-500 text-lg">Aucun hébergement disponible pour le moment.</p>
                </div>
            )}
        </div>
    )
} 