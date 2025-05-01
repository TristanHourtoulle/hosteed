'use client';

import { useState, useEffect } from 'react';
import { findAllSecurity } from '@/lib/services/security.services';
import { findAllMeals } from "@/lib/services/meals.service";
import {findAllEquipments} from "@/lib/services/equipments.service";
import { findAllServices } from "@/lib/services/services.service";

interface Security {
    id: string;
    name: string;
    description?: string;
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

interface Filters {
    selectedSecurities: string[];
    selectedMeals: string[];
    selectedEquipments: string[];
    selectedServices: string[];
    searchRadius: number;
    arrivingDate: string;
    leavingDate: string;
}

interface FiltersPanelProps {
    filters: Filters;
    setFilters: (filters: Filters) => void;
}

export default function FiltersPanel({ filters, setFilters }: FiltersPanelProps) {
    const [securities, setSecurities] = useState<Security[]>([]);
    const [meals, setMeals] = useState<Meals[]>([]);
    const [equipments, setEquipments] = useState<Equipments[]>([]);
    const [services, setServices] = useState<Services[]>([]);
    const [selectedSecurities, setSelectedSecurities] = useState<string[]>(filters.selectedSecurities);
    const [selectedMeals, setSelectedMeals] = useState<string[]>(filters.selectedMeals);
    const [selectedEquipments, setSelectedEquipments] = useState<string[]>(filters.selectedEquipments);
    const [selectedServices, setSelectedServices] = useState<string[]>(filters.selectedServices);
    const [searchRadius, setSearchRadius] = useState<number>(filters.searchRadius);
    const [arrivingDate, setArrivingDate] = useState<string>(filters.arrivingDate);
    const [leavingDate, setLeavingDate] = useState<string>(filters.leavingDate);

    useEffect(() => {
        const fetchData = async () => {
            const [securityList, mealsList, equipmentsList, servicesList] = await Promise.all([
                findAllSecurity(),
                findAllMeals(),
                findAllEquipments(),
                findAllServices()
            ]);

            if (securityList) {
                setSecurities(securityList);
            }
            if (mealsList) {
                setMeals(mealsList);
            }
            if (equipmentsList) {
                setEquipments(equipmentsList);
            }
            if (servicesList) {
                setServices(servicesList);
            }
        };
        fetchData();
    }, []);

    const handleSecurityChange = (securityId: string) => {
        const newSelectedSecurities = selectedSecurities.includes(securityId)
            ? selectedSecurities.filter(id => id !== securityId)
            : [...selectedSecurities, securityId];

        setSelectedSecurities(newSelectedSecurities);
        setFilters({
            ...filters,
            selectedSecurities: newSelectedSecurities
        });
    };

    const handleMealChange = (mealId: string) => {
        const newSelectedMeals = selectedMeals.includes(mealId)
            ? selectedMeals.filter(id => id !== mealId)
            : [...selectedMeals, mealId];

        setSelectedMeals(newSelectedMeals);
        setFilters({
            ...filters,
            selectedMeals: newSelectedMeals
        });
    };

    const handleEquipmentChange = (equipmentId: string) => {
        const newSelectedEquipments = selectedEquipments.includes(equipmentId)
            ? selectedEquipments.filter(id => id !== equipmentId)
            : [...selectedEquipments, equipmentId];

        setSelectedEquipments(newSelectedEquipments);
        setFilters({
            ...filters,
            selectedEquipments: newSelectedEquipments
        });
    };

    const handleServiceChange = (serviceId: string) => {
        const newSelectedServices = selectedServices.includes(serviceId)
            ? selectedServices.filter(id => id !== serviceId)
            : [...selectedServices, serviceId];

        setSelectedServices(newSelectedServices);
        setFilters({
            ...filters,
            selectedServices: newSelectedServices
        });
    };

    const handleSearchRadiusChange = (value: number) => {
        setSearchRadius(value);
        setFilters({
            ...filters,
            searchRadius: value
        });
    };

    const handleArrivingDateChange = (value: string) => {
        setArrivingDate(value);
        setFilters({
            ...filters,
            arrivingDate: value
        });
    };

    const handleLeavingDateChange = (value: string) => {
        setLeavingDate(value);
        setFilters({
            ...filters,
            leavingDate: value
        });
    };

    return (
        <div className="w-64 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Filtres</h2>
            
            <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 text-gray-900">Options de sécurité</h3>
                <div className="space-y-2">
                    {securities.map((security) => (
                        <label key={security.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={selectedSecurities.includes(security.id)}
                                onChange={() => handleSecurityChange(security.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">{security.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 text-gray-900">Options de repas</h3>
                <div className="space-y-2">
                    {meals.map((meal) => (
                        <label key={meal.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={selectedMeals.includes(meal.id)}
                                onChange={() => handleMealChange(meal.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">{meal.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 text-gray-900">Équipements</h3>
                <div className="space-y-2">
                    {equipments.map((equipment) => (
                        <label key={equipment.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={selectedEquipments.includes(equipment.id)}
                                onChange={() => handleEquipmentChange(equipment.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">{equipment.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 text-gray-900">Services</h3>
                <div className="space-y-2">
                    {services.map((service) => (
                        <label key={service.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={selectedServices.includes(service.id)}
                                onChange={() => handleServiceChange(service.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">{service.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 text-gray-900">Rayon de recherche</h3>
                <div className="flex items-center space-x-2">
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={searchRadius}
                        onChange={(e) => handleSearchRadiusChange(Number(e.target.value))}
                        className="w-full"
                    />
                    <span className="text-sm text-gray-900">{searchRadius} km</span>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 text-gray-900">Date d'arrivée</h3>
                <input
                    type="date"
                    value={arrivingDate}
                    onChange={(e) => handleArrivingDateChange(e.target.value)}
                    className="w-full"
                />
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 text-gray-900">Date de départ</h3>
                <input
                    type="date"
                    value={leavingDate}
                    onChange={(e) => handleLeavingDateChange(e.target.value)}
                    className="w-full"
                />
            </div>
        </div>
    );
}
