'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchBar from '@/components/ui/searchBar';
import { findAllProducts } from '@/lib/services/product.service';
import { useEffect } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import FiltersPanel from '@/components/ui/filtersPanel';

interface Product {
    id: string;
    name: string;
    description: string;
    address: string;
    longitude: number;
    latitude: number;
    img?: { img: string }[];
    basePrice: string;
    equipments?: { id: string; name: string; }[];
    servicesList?: { id: string; name: string; }[];
    mealsList?: { id: string; name: string; }[];
    securities?: { id: string; name: string; }[];
    arriving: number;
    leaving: number;
    typeRentId?: string;
}

export default function SearchResults() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Chargement...</div>}>
            <SearchResultsContent />
        </Suspense>
    );
}

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const searchQuery = searchParams.get('q') || '';
    const typeRentId = searchParams.get('typeRent') || '';
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        selectedSecurities: [] as string[],
        selectedMeals: [] as string[],
        selectedEquipments: [] as string[],
        selectedServices: [] as string[],
        searchRadius: 50,
        arrivingDate: '',
        leavingDate: '',
    });

    const handleSearch = (params: {
        location: string;
        type: string;
        centerLat?: number;
        centerLon?: number;
        searchRadius?: number;
    }) => {
        const searchParams = new URLSearchParams();
        if (params.location) searchParams.set('location', params.location);
        if (params.type) searchParams.set('type', params.type);
        if (typeRentId) searchParams.set('typeRent', typeRentId);
        router.push(`/search?${searchParams.toString()}`);
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const allProducts = await findAllProducts();
                if (allProducts) {
                    // Filtrer les produits en fonction de la recherche et des filtres
                    const filteredProducts = allProducts.filter((product: Product) => {
                        // Filtre par typeRent
                        const matchesTypeRent = !typeRentId || product.typeRentId === typeRentId;

                        // Filtre par recherche textuelle
                        const matchesSearch =
                            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());

                        // Filtre par équipements
                        const matchesEquipments = filters.selectedEquipments.length === 0 ||
                            filters.selectedEquipments.every(equipmentId =>
                                product.equipments?.some(equipment => equipment.id === equipmentId)
                            );

                        // Filtre par services
                        const matchesServices = filters.selectedServices.length === 0 ||
                            filters.selectedServices.every(serviceId =>
                                product.servicesList?.some(service => service.id === serviceId)
                            );

                        // Filtre par repas
                        const matchesMeals = filters.selectedMeals.length === 0 ||
                            filters.selectedMeals.every(mealId =>
                                product.mealsList?.some(meal => meal.id === mealId)
                            );

                        // Filtre par sécurités
                        let matchesSecurities = true;
                        if (filters.selectedSecurities.length > 0) {
                            if (!product.securities || product.securities.length === 0) {
                                matchesSecurities = false;
                            } else {
                                matchesSecurities = filters.selectedSecurities.every(securityId =>
                                    product.securities?.some(security => security.id === securityId)
                                );
                            }
                        }

                        const matchesDates = !filters.arrivingDate || !filters.leavingDate ||
                            (new Date(product.arriving) <= new Date(filters.arrivingDate) &&
                             new Date(product.leaving) >= new Date(filters.leavingDate));

                        return matchesTypeRent && matchesSearch && matchesEquipments && matchesServices &&
                               matchesMeals && matchesSecurities && matchesDates;
                    });
                    setProducts(filteredProducts);
                }
            } catch {
                setError('Erreur lors de la récupération des produits');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchQuery, filters, typeRentId]);

    if (loading) {
        return <div className="min-h-screen bg-white flex items-center justify-center">Chargement...</div>;
    }

    if (error) {
        return <div className="min-h-screen bg-white flex items-center justify-center text-red-600">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <SearchBar onSearch={handleSearch} />
                </div>

                <div className="flex gap-8">
                    {/* Side Panel */}
                    <div className="w-80">
                        <FiltersPanel filters={filters} setFilters={setFilters} />
                    </div>

                    {/* Results */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-6">
                            {searchQuery
                                ? `Résultats pour "${searchQuery}"`
                                : typeRentId
                                ? 'Hébergements disponibles'
                                : 'Tous les hébergements'}
                        </h1>

                        {products.length === 0 ? (
                            <p className="text-gray-600">Aucun résultat trouvé</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
