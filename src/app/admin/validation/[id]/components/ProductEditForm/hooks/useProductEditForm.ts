import { useState } from 'react'
import type { FormData, Product } from '../types'
import type { TypeRentInterface } from '@/lib/interface/typeRentInterface'

interface UseProductEditFormProps {
  product: Product
  types: TypeRentInterface[]
}

export const useProductEditForm = ({ product, types }: UseProductEditFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: product.name,
    description: product.description,
    address: product.address,
    completeAddress: '',
    placeId: '',
    phone: '',
    phoneCountry: 'MG',
    room: product.bedroom?.toString() || '',
    bathroom: product.bathroom?.toString() || '',
    arriving: product.arriving?.toString() || '',
    leaving: product.leaving?.toString() || '',
    basePrice: product.basePrice,
    priceMGA: product.priceMGA || '',
    basePriceMGA: product.priceMGA || '',
    specialPrices: [],
    autoAccept: false,
    typeId: product.type?.id || '',
    equipmentIds: product.equipments?.map(e => e.id) || [],
    mealIds: product.mealsList?.map(m => m.id) || [],
    securityIds: product.securities?.map(s => s.id) || [],
    serviceIds: product.servicesList?.map(s => s.id) || [],
    includedServiceIds: product.includedServices?.map(s => s.id) || [],
    extraIds: product.extras?.map(e => e.id) || [],
    highlightIds: product.highlights?.map(h => h.id) || [],
    surface: '',
    maxPeople: '',
    minPeople: '',
    accessibility: false,
    petFriendly: false,
    nearbyPlaces: [],
    proximityLandmarks: [],
    transportation: '',
    typeRentId: product.type?.id || '',
    isHotel: false,
    hotelName: '',
    availableRooms: '',
  })

  const [newPlace, setNewPlace] = useState({
    name: '',
    distance: '',
    unit: 'mètres' as 'mètres' | 'kilomètres',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    // Si on change le type d'hébergement, vérifier si c'est un hôtel
    if (name === 'typeId') {
      const selectedType = types.find(t => t.id === value)
      const isHotelType = Boolean(selectedType?.isHotelType)
      setFormData(prev => ({
        ...prev,
        [name]: value,
        typeRentId: value, // Sync typeRentId with typeId
        isHotel: isHotelType,
        // Réinitialiser les champs hôtel si ce n'est pas un hôtel
        hotelName: isHotelType ? prev.hotelName : '',
        availableRooms: isHotelType ? prev.availableRooms : '',
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }))
    }
  }

  const handleCheckboxChange = (field: keyof FormData, id: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[]
      const isChecked = currentArray.includes(id)

      return {
        ...prev,
        [field]: isChecked ? currentArray.filter(item => item !== id) : [...currentArray, id],
      }
    })
  }

  const addNearbyPlace = () => {
    if (newPlace.name.trim()) {
      setFormData(prev => ({
        ...prev,
        nearbyPlaces: [...prev.nearbyPlaces, { ...newPlace }],
      }))
      setNewPlace({ name: '', distance: '', unit: 'mètres' })
    }
  }

  const removeNearbyPlace = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nearbyPlaces: prev.nearbyPlaces.filter((_, i) => i !== index),
    }))
  }

  return {
    formData,
    setFormData,
    newPlace,
    setNewPlace,
    handleInputChange,
    handleCheckboxChange,
    addNearbyPlace,
    removeNearbyPlace,
  }
}
