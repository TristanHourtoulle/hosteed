import { useState } from 'react'
import type { ProductFormData, Product } from '../types'
import type { TypeRentInterface } from '@/lib/interface/typeRentInterface'

interface UseProductEditFormProps {
  product: Product
  types: TypeRentInterface[]
}

export const useProductEditForm = ({ product, types }: UseProductEditFormProps) => {
  // Helper function to convert hour integer to HH:mm format
  const formatHour = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  // Debug logging - voir les données reçues
  console.log('🔍 [Admin Edit Form] Product data received:', {
    phone: product.phone,
    phoneCountry: product.phoneCountry,
    room: product.room, // ✅ Correct field name (not 'bedroom')
    arriving: product.arriving,
    leaving: product.leaving,
    maxPeople: product.maxPeople,
    minPeople: product.minPeople,
    surface: product.surface,
    nearbyPlaces: product.nearbyPlaces,
    propertyInfo: product.propertyInfo,
    hotel: product.hotel,
  })

  const [formData, setFormData] = useState<ProductFormData>({
    name: product.name,
    description: product.description,
    address: product.address,
    completeAddress: '',
    placeId: '',
    latitude: product.latitude || 0,
    longitude: product.longitude || 0,
    phone: product.phone || '',
    phoneCountry: product.phoneCountry || 'MG',
    typeId: product.type?.id || '',
    typeRentId: product.type?.id || '', // Sync with typeId
    room: product.room?.toString() || '', // ✅ Use 'room' not 'bedroom'
    bathroom: product.bathroom?.toString() || '',
    arriving: product.arriving ? formatHour(product.arriving) : '', // ✅ Convert 14 to "14:00"
    leaving: product.leaving ? formatHour(product.leaving) : '', // ✅ Convert 12 to "12:00"
    basePrice: product.basePrice,
    priceMGA: product.priceMGA || '',
    basePriceMGA: product.priceMGA || '', // Sync with priceMGA
    specialPrices: [],
    autoAccept: false,
    equipmentIds: product.equipments?.map(e => e.id) || [],
    mealIds: product.mealsList?.map(m => m.id) || [],
    securityIds: product.securities?.map(s => s.id) || [],
    serviceIds: product.servicesList?.map(s => s.id) || [],
    includedServiceIds: product.includedServices?.map(s => s.id) || [],
    extraIds: product.extras?.map(e => e.id) || [],
    highlightIds: product.highlights?.map(h => h.id) || [],
    surface: product.surface?.toString() || '',
    minPeople: product.minPeople?.toString() || '',
    maxPeople: product.maxPeople?.toString() || '', // ✅ No fallback to 'guest'
    accessibility: product.propertyInfo?.hasHandicapAccess || false,
    petFriendly: product.propertyInfo?.hasPetsOnProperty || false,
    nearbyPlaces: product.nearbyPlaces?.map(place => ({
      name: place.name,
      distance: place.distance || '',
      unit: (place.distance && parseFloat(place.distance) < 1000 ? 'mètres' : 'kilomètres') as 'mètres' | 'kilomètres',
    })) || [],
    proximityLandmarks: [],
    transportation: '',
    smokingAllowed: false,
    petsAllowed: false,
    eventsAllowed: false,
    selfCheckIn: false,
    selfCheckInType: '',
    hasStairs: false,
    hasElevator: false,
    hasHandicapAccess: false,
    hasPetsOnProperty: false,
    additionalNotes: '',
    isHotel: !!(product.hotel && product.hotel.length > 0), // ✅ Check if array has items
    hotelName: product.hotel && product.hotel.length > 0 ? product.hotel[0].name : '', // ✅ Take first hotel
    availableRooms: product.availableRooms?.toString() || '',
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
        typeRentId: value, // Sync typeRentId with typeId for backward compatibility
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

  const handleCheckboxChange = (field: keyof ProductFormData, id: string) => {
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
