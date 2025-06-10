// TODO: refactor this file because it's larger than 200 lines
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import React from 'react';
import { findProductById, resubmitProductWithChange } from '@/lib/services/product.service';
import { findAllTypeRent } from '@/lib/services/typeRent.service';
import { findAllSecurity } from '@/lib/services/security.services';
import { findAllMeals } from '@/lib/services/meals.service';
import { findAllEquipments } from '@/lib/services/equipments.service';
import { findAllServices } from '@/lib/services/services.service';
import Image from 'next/image';

interface TypeRent {
    id: string;
    name: string;
}

interface Security {
    id: string;
    name: string;
}

interface Meals {
    id: string;
    name: string;
}

interface Equipments {
    id: string;
    name: string;
}

interface Services {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    description: string;
    address: string;
    longitude: number;
    latitude: number;
    basePrice: string;
    room: number | null;
    bathroom: number | null;
    arriving: number;
    leaving: number;
    typeId: string;
    img: { img: string }[];
    equipments: { id: string }[];
    servicesList: { id: string }[];
    mealsList: { id: string }[];
    securities: { id: string }[];
}
export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = React.use(params) as { id: string };
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    const [types, setTypes] = useState<TypeRent[]>([]);
    const [securities, setSecurities] = useState<Security[]>([]);
    const [meals, setMeals] = useState<Meals[]>([]);
    const [equipments, setEquipments] = useState<Equipments[]>([]);
    const [services, setServices] = useState<Services[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        longitude: 0,
        latitude: 0,
        basePrice: '',
        room: 1,
        bathroom: 1,
        typeId: '',
        arriving: 14,
        leaving: 12,
        selectedSecurities: [] as string[],
        selectedMeals: [] as string[],
        selectedEquipments: [] as string[],
        selectedServices: [] as string[]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productData, typesData, securitiesData, mealsData, equipmentsData, servicesData] = await Promise.all([
                    findProductById(resolvedParams.id),
                    findAllTypeRent(),
                    findAllSecurity(),
                    findAllMeals(),
                    findAllEquipments(),
                    findAllServices()
                ]);

                if (productData) {
                    const convertedProduct = {
                        ...productData,
                        room: productData.room ? Number(productData.room) : null,
                        bathroom: productData.bathroom ? Number(productData.bathroom) : null
                    };
                    setProduct(convertedProduct);
                    setFormData({
                        name: productData.name,
                        description: productData.description,
                        address: productData.address,
                        longitude: productData.longitude,
                        latitude: productData.latitude,
                        basePrice: productData.basePrice,
                        room: productData.room ? Number(productData.room) : 1,
                        bathroom: productData.bathroom ? Number(productData.bathroom) : 1,
                        typeId: productData.typeId,
                        arriving: productData.arriving,
                        leaving: productData.leaving,
                        selectedSecurities: productData.securities?.map(s => s.id) || [],
                        selectedMeals: productData.mealsList?.map(m => m.id) || [],
                        selectedEquipments: productData.equipments?.map(e => e.id) || [],
                        selectedServices: productData.servicesList?.map(s => s.id) || []
                    });
                    setPreviewImages(productData.img?.map(img => img.img) || []);
                }

                if (typesData) setTypes(typesData);
                if (securitiesData) setSecurities(securitiesData);
                if (mealsData) setMeals(mealsData);
                if (equipmentsData) setEquipments(equipmentsData);
                if (servicesData) setServices(servicesData);
            } catch (err) {
                setError('Erreur lors du chargement des données');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (session?.user) {
            fetchData();
        }
    }, [session, resolvedParams.id]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages(prev => [...prev, ...newFiles]);

            // Créer les previews
            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Convertir les images en URLs
            const imageUrls = await Promise.all(
                images.map(async (file) => {
                    // Ici, vous devrez implémenter la logique pour uploader les images
                    // et obtenir leurs URLs
                    return URL.createObjectURL(file);
                })
            );

            const result = await resubmitProductWithChange(resolvedParams.id, {
                name: formData.name,
                description: formData.description,
                address: formData.address,
                longitude: formData.longitude,
                latitude: formData.latitude,
                basePrice: formData.basePrice,
                room: formData.room,
                bathroom: formData.bathroom,
                arriving: formData.arriving,
                leaving: formData.leaving,
                typeId: formData.typeId,
                securities: formData.selectedSecurities,
                equipments: formData.selectedEquipments,
                services: formData.selectedServices,
                meals: formData.selectedMeals,
                images: [...previewImages, ...imageUrls]
            });

            if (result) {
                router.push('/dashboard/host/validation');
            } else {
                setError('Erreur lors de la mise à jour de l\'annonce');
                console.log(product, securities, meals);
            }
        } catch (err) {
            setError('Erreur lors de la mise à jour de l\'annonce');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
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

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Modifier l&apos;annonce</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informations de base */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations de base</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom de l&apos;annonce
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Prix de base
                                </label>
                                <input
                                    type="text"
                                    value={formData.basePrice}
                                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={4}
                                required
                            />
                        </div>
                    </div>

                    {/* Localisation */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Localisation</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Adresse
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type de location
                                </label>
                                <select
                                    value={formData.typeId}
                                    onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="">Sélectionner un type</option>
                                    {types.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Caractéristiques */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Caractéristiques</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de chambres
                                </label>
                                <input
                                    type="number"
                                    value={formData.room}
                                    onChange={(e) => setFormData({ ...formData, room: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    min="1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de salles de bain
                                </label>
                                <input
                                    type="number"
                                    value={formData.bathroom}
                                    onChange={(e) => setFormData({ ...formData, bathroom: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    min="1"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Équipements et services */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Équipements et services</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Équipements
                                </label>
                                <div className="space-y-2">
                                    {equipments.map((equipment) => (
                                        <label key={equipment.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.selectedEquipments.includes(equipment.id)}
                                                onChange={(e) => {
                                                    const newEquipments = e.target.checked
                                                        ? [...formData.selectedEquipments, equipment.id]
                                                        : formData.selectedEquipments.filter(id => id !== equipment.id);
                                                    setFormData({ ...formData, selectedEquipments: newEquipments });
                                                }}
                                                className="mr-2"
                                            />
                                            {equipment.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Services
                                </label>
                                <div className="space-y-2">
                                    {services.map((service) => (
                                        <label key={service.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.selectedServices.includes(service.id)}
                                                onChange={(e) => {
                                                    const newServices = e.target.checked
                                                        ? [...formData.selectedServices, service.id]
                                                        : formData.selectedServices.filter(id => id !== service.id);
                                                    setFormData({ ...formData, selectedServices: newServices });
                                                }}
                                                className="mr-2"
                                            />
                                            {service.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Images</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {previewImages.map((preview, index) => (
                                <div key={index} className="relative aspect-square">
                                    <Image
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        fill
                                        className="object-cover rounded-lg"
                                    />
                                </div>
                            ))}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="w-full"
                        />
                    </div>

                    {/* Boutons */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard/host')}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-4 py-2 rounded-md text-white ${
                                submitting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {submitting ? 'Modification en cours...' : 'Modifier l\'annonce'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
