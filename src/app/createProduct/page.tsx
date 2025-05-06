'use client';

import { useState, useEffect } from 'react';
import { createProduct } from '@/lib/services/product.service';
import { findAllTypeRent } from '@/lib/services/typeRent.service';
import { findAllSecurity } from '@/lib/services/security.services';
import { findAllMeals } from '@/lib/services/meals.service';
import { findAllEquipments } from '@/lib/services/equipments.service';
import { findAllServices } from '@/lib/services/services.service';
import { useRouter } from 'next/navigation';
import {useSession} from "next-auth/react";

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

export default function CreateProduct() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        minPeople: 1,
        maxPeople: 1,
        typeId: '',
        arriving: 14,
        leaving: 12,
        autoAccept: false,
        phone: '',
        categories: 1,
        validate: false,
        userManager: 1,
        selectedSecurities: [] as string[],
        selectedMeals: [] as string[],
        selectedEquipments: [] as string[],
        selectedServices: [] as string[]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [typesList, securitiesList, mealsList, equipmentsList, servicesList] = await Promise.all([
                    findAllTypeRent(),
                    findAllSecurity(),
                    findAllMeals(),
                    findAllEquipments(),
                    findAllServices()
                ]);

                if (typesList) setTypes(typesList);
                if (securitiesList) setSecurities(securitiesList);
                if (mealsList) setMeals(mealsList);
                if (equipmentsList) setEquipments(equipmentsList);
                if (servicesList) setServices(servicesList);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
                setError('Erreur lors du chargement des données');
            }
        };

        fetchData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files);
            setImages(prev => [...prev, ...newImages]);

            // Créer les prévisualisations
            const newPreviews = await Promise.all(
                newImages.map(file => URL.createObjectURL(file))
            );
            setPreviewImages(prev => [...prev, ...newPreviews]);
        }
    };

    const handleCheckboxChange = (type: 'securities' | 'meals' | 'equipments' | 'services', id: string) => {
        setFormData(prev => {
            const selectedArray = prev[`selected${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof prev] as string[];
            const newSelected = selectedArray.includes(id)
                ? selectedArray.filter(item => item !== id)
                : [...selectedArray, id];

            return {
                ...prev,
                [`selected${type.charAt(0).toUpperCase() + type.slice(1)}`]: newSelected
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Convertir les images en base64 côté client
            const base64Images = await Promise.all(
                images.map(file => {
                    return new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => {
                            if (typeof reader.result === 'string') {
                                resolve(reader.result);
                            } else {
                                reject(new Error('Erreur lors de la conversion en base64'));
                            }
                        };
                        reader.onerror = error => reject(error);
                    });
                })
            );
            if (!session?.user?.id) {
                setError("No userID available")
                return
            }
            const product = await createProduct({
                ...formData,
                images: base64Images,
                securities: formData.selectedSecurities,
                meals: formData.selectedMeals,
                equipments: formData.selectedEquipments,
                services: formData.selectedServices,
                userId: session.user.id,
            });

            if (product) {
                router.push('/dashboard');
            } else {
                setError('Erreur lors de la création du produit');
            }
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            setError('Erreur lors de la création du produit');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Créer un nouveau produit</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nom</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            name="typeId"
                            value={formData.typeId}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">Sélectionnez un type</option>
                            {types.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Adresse</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Prix de base</label>
                        <input
                            type="text"
                            name="basePrice"
                            value={formData.basePrice}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre de chambres</label>
                        <input
                            type="number"
                            name="room"
                            value={formData.room}
                            onChange={handleInputChange}
                            required
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre de salles de bain</label>
                        <input
                            type="number"
                            name="bathroom"
                            value={formData.bathroom}
                            onChange={handleInputChange}
                            required
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre minimum de personnes</label>
                        <input
                            type="number"
                            name="minPeople"
                            value={formData.minPeople}
                            onChange={handleInputChange}
                            required
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre maximum de personnes</label>
                        <input
                            type="number"
                            name="maxPeople"
                            value={formData.maxPeople}
                            onChange={handleInputChange}
                            required
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Heure d&apos;arrivée</label>
                        <input
                            type="number"
                            name="arriving"
                            value={formData.arriving}
                            onChange={handleInputChange}
                            required
                            min="0"
                            max="23"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Heure de départ</label>
                        <input
                            type="number"
                            name="leaving"
                            value={formData.leaving}
                            onChange={handleInputChange}
                            required
                            min="0"
                            max="23"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Options de sécurité</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                            {securities.map(security => (
                                <label key={security.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.selectedSecurities.includes(security.id)}
                                        onChange={() => handleCheckboxChange('securities', security.id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-900">{security.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Options de repas</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                            {meals.map(meal => (
                                <label key={meal.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.selectedMeals.includes(meal.id)}
                                        onChange={() => handleCheckboxChange('meals', meal.id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-900">{meal.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Équipements</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                            {equipments.map(equipment => (
                                <label key={equipment.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.selectedEquipments.includes(equipment.id)}
                                        onChange={() => handleCheckboxChange('equipments', equipment.id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-900">{equipment.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Services</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                            {services.map(service => (
                                <label key={service.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.selectedServices.includes(service.id)}
                                        onChange={() => handleCheckboxChange('services', service.id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-900">{service.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Images</label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-1 block w-full"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {previewImages.map((preview, index) => (
                            <div key={index} className="relative">
                                <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImages(prev => prev.filter((_, i) => i !== index));
                                        setPreviewImages(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="autoAccept"
                            checked={formData.autoAccept}
                            onChange={handleInputChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Acceptation automatique des réservations</span>
                    </label>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                    >
                        {loading ? 'Création en cours...' : 'Créer le produit'}
                    </button>
                </div>
            </form>
        </div>
    );
}
