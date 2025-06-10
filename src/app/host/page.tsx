// TODO: refactor this file because it's larger than 200 lines
'use client'
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

import { useEffect, useState, useRef, Suspense } from "react";
import { TypeRent } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { findAllTypeRent } from "@/lib/services/typeRent.service";
import { findAllProducts } from '@/lib/services/product.service';
import { findAllSecurity } from '@/lib/services/security.services';
import { findAllMeals } from "@/lib/services/meals.service";
import { findAllEquipments } from "@/lib/services/equipments.service";
import { findAllServices } from "@/lib/services/services.service";
import ProductCard from '@/components/ui/ProductCard';
import { Input, Button } from "@/shadcnui";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";

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
    certified?: boolean;
    validate?: string;
}

interface Suggestion {
    display_name: string;
    lat: string;
    lon: string;
}

function HostPageContent() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [typeRent, setTypeRent] = useState<TypeRent[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Get URL parameters - check both 'type' and 'typeRent' for compatibility
    const typeRentId = searchParams.get('type') || searchParams.get('typeRent') || '';
    const searchQuery = searchParams.get('q') || searchParams.get('location') || '';
    const featured = searchParams.get('featured') === 'true';
    const popular = searchParams.get('popular') === 'true';
    const recent = searchParams.get('recent') === 'true';
    const promo = searchParams.get('promo') === 'true';
    
    // Search state
    const [location, setLocation] = useState(searchQuery);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedType, setSelectedType] = useState(typeRentId);

    const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    
    // Filter state
    const [securities, setSecurities] = useState<{id: string; name: string}[]>([]);
    const [meals, setMeals] = useState<{id: string; name: string}[]>([]);
    const [equipments, setEquipments] = useState<{id: string; name: string}[]>([]);
    const [services, setServices] = useState<{id: string; name: string}[]>([]);
    const [filters, setFilters] = useState({
        selectedSecurities: [] as string[],
        selectedMeals: [] as string[],
        selectedEquipments: [] as string[],
        selectedServices: [] as string[],
        searchRadius: 50,
        arrivingDate: '',
        leavingDate: '',
    });

    // Load initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [types, securityList, mealsList, equipmentsList, servicesList] = await Promise.all([
                    findAllTypeRent(),
                    findAllSecurity(),
                    findAllMeals(),
                    findAllEquipments(),
                    findAllServices()
                ]);

                if (types) setTypeRent(types);
                if (securityList) setSecurities(securityList);
                if (mealsList) setMeals(mealsList);
                if (equipmentsList) setEquipments(equipmentsList);
                if (servicesList) setServices(servicesList);
            } catch (error) {
                console.error("Error loading data:", error);
                setError('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Load and filter products - using the exact same logic as search page
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const allProducts = await findAllProducts();
                if (allProducts) {
                    // Filtrer les produits en fonction de la recherche et des filtres
                    let filteredProducts = allProducts.filter((product: Product) => {
                        // Filtre par typeRent
                        const matchesTypeRent = !selectedType || product.typeRentId === selectedType;

                        // Filtre par recherche textuelle
                        const matchesSearch = !location ||
                            product.name.toLowerCase().includes(location.toLowerCase()) ||
                            product.description.toLowerCase().includes(location.toLowerCase()) ||
                            product.address.toLowerCase().includes(location.toLowerCase());

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

                    // Apply special filters
                    if (featured) {
                        // Filter for featured products (certified or validated products)
                        filteredProducts = filteredProducts.filter(product => product.certified || product.validate === 'Approve');
                    }

                    if (popular) {
                        // Sort by most popular (you can implement your own logic here)
                        // For now, let's sort by those with more reviews or higher ratings
                        filteredProducts = filteredProducts.sort((a, b) => {
                            // Assuming products with more equipment/services are more popular
                            const aScore = (a.equipments?.length || 0) + (a.servicesList?.length || 0);
                            const bScore = (b.equipments?.length || 0) + (b.servicesList?.length || 0);
                            return bScore - aScore;
                        });
                    }

                    if (recent) {
                        // Sort by most recent (assuming products have a creation date)
                        // Since we don't have a creation date, let's sort by id (newer ids = more recent)
                        filteredProducts = filteredProducts.sort((a, b) => b.id.localeCompare(a.id));
                    }

                    if (promo) {
                        // Filter for products with discounts or special offers
                        // For now, let's show products with lower prices or specific criteria
                        filteredProducts = filteredProducts.filter(product => {
                            const price = parseFloat(product.basePrice);
                            return price < 100; // Example: products under 100€
                        });
                    }

                    setProducts(filteredProducts);
                }
            } catch (error) {
                console.error("Error loading products:", error);
                setError('Erreur lors de la récupération des produits');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [selectedType, location, filters, featured, popular, recent, promo]);

    // Location suggestions
    useEffect(() => {
        if (location.length < 3) {
            setSuggestions([]);
            return;
        }

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=5`
                );
                const data = await response.json();
                setSuggestions(data);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        }, 300);
    }, [location]);

    const handleSuggestionClick = (suggestion: Suggestion) => {
        setLocation(suggestion.display_name);
        setShowSuggestions(false);
    };

    const handleSearch = () => {
        // Trigger filtering by updating the location state
        setShowSuggestions(false);
    };

    const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: checked 
                ? [...prev[filterType as keyof typeof prev] as string[], value]
                : (prev[filterType as keyof typeof prev] as string[]).filter(id => id !== value)
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des hébergements...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">{error}</p>
                    <Button 
                        onClick={() => window.location.reload()} 
                        className="mt-4"
                    >
                        Réessayer
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                {session?.user && (
                    <div className="mb-8 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">Bienvenue {session.user.name}</h1>
                        <div className="flex gap-4">
                            <Button onClick={() => router.push('/search')}>
                                Recherche avancée
                            </Button>
                            <Button variant="destructive" onClick={() => signOut()}>
                                Déconnexion
                            </Button>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Entrez une adresse, ville..."
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                {showSuggestions && suggestions.length > 0 && (
                                    <div
                                        ref={suggestionsRef}
                                        className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md mt-1 max-h-60 overflow-y-auto z-10 shadow-lg"
                                    >
                                        {suggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="p-3 hover:bg-gray-50 cursor-pointer text-sm"
                                            >
                                                {suggestion.display_name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="md:w-64">
                                <Select 
                                    value={selectedType} 
                                    onChange={setSelectedType}
                                    options={[
                                        { value: '', label: 'Tous les types' },
                                        ...typeRent.map(type => ({ value: type.id, label: type.name }))
                                    ]}
                                    placeholder="Type de logement"
                                />
                            </div>
                            <Button onClick={handleSearch} className="md:w-auto">
                                Rechercher
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:w-80">
                        <Card>
                            <CardHeader>
                                <CardTitle>Filtres</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Security Options */}
                                {securities.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium mb-3">Options de sécurité</h3>
                                        <div className="space-y-2">
                                            {securities.map((security) => (
                                                <label key={security.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.selectedSecurities.includes(security.id)}
                                                        onChange={(e) => 
                                                            handleFilterChange('selectedSecurities', security.id, e.target.checked)
                                                        }
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm">{security.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Meals Options */}
                                {meals.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium mb-3">Options de repas</h3>
                                        <div className="space-y-2">
                                            {meals.map((meal) => (
                                                <label key={meal.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.selectedMeals.includes(meal.id)}
                                                        onChange={(e) => 
                                                            handleFilterChange('selectedMeals', meal.id, e.target.checked)
                                                        }
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm">{meal.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Equipment Options */}
                                {equipments.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium mb-3">Équipements</h3>
                                        <div className="space-y-2">
                                            {equipments.map((equipment) => (
                                                <label key={equipment.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.selectedEquipments.includes(equipment.id)}
                                                        onChange={(e) => 
                                                            handleFilterChange('selectedEquipments', equipment.id, e.target.checked)
                                                        }
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm">{equipment.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Services Options */}
                                {services.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium mb-3">Services</h3>
                                        <div className="space-y-2">
                                            {services.map((service) => (
                                                <label key={service.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.selectedServices.includes(service.id)}
                                                        onChange={(e) => 
                                                            handleFilterChange('selectedServices', service.id, e.target.checked)
                                                        }
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm">{service.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Search Radius */}
                                <div>
                                    <h3 className="text-sm font-medium mb-3">
                                        Rayon de recherche: {filters.searchRadius} km
                                    </h3>
                                    <input
                                        type="range"
                                        min={5}
                                        max={100}
                                        step={5}
                                        value={filters.searchRadius}
                                        onChange={(e) => setFilters(prev => ({ ...prev, searchRadius: parseInt(e.target.value) }))}
                                        className="w-full"
                                    />
                                </div>

                                {/* Date Filters */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Date d&apos;arrivée</h3>
                                        <input
                                            type="date"
                                            value={filters.arrivingDate}
                                            onChange={(e) => setFilters(prev => ({ ...prev, arrivingDate: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Date de départ</h3>
                                        <input
                                            type="date"
                                            value={filters.leavingDate}
                                            onChange={(e) => setFilters(prev => ({ ...prev, leavingDate: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Results */}
                    <div className="flex-1">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {location
                                    ? `Résultats pour "${location}"`
                                    : featured
                                    ? '⭐ Hébergements vedettes'
                                    : popular
                                    ? '🔥 Hébergements populaires'
                                    : recent
                                    ? '🆕 Hébergements récemment ajoutés'
                                    : promo
                                    ? '💰 Offres spéciales'
                                    : selectedType
                                    ? `${typeRent.find(t => t.id === selectedType)?.name || 'Hébergements'} disponibles`
                                    : 'Tous les hébergements'
                                }
                            </h2>
                            <p className="text-gray-600 mt-1">
                                {products.length} {products.length === 1 ? 'résultat trouvé' : 'résultats trouvés'}
                            </p>
                        </div>

                        {products.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-gray-500">Aucun hébergement trouvé avec ces critères</p>
                                    {(selectedType || location || filters.selectedSecurities.length > 0) && (
                                        <Button 
                                            variant="outline" 
                                            className="mt-4"
                                            onClick={() => {
                                                setSelectedType('');
                                                setLocation('');
                                                setFilters({
                                                    selectedSecurities: [],
                                                    selectedMeals: [],
                                                    selectedEquipments: [],
                                                    selectedServices: [],
                                                    searchRadius: 50,
                                                    arrivingDate: '',
                                                    leavingDate: '',
                                                });
                                            }}
                                        >
                                            Réinitialiser les filtres
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

export default function HostPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des hébergements...</p>
                </div>
            </div>
        }>
            <HostPageContent />
        </Suspense>
    );
}; 