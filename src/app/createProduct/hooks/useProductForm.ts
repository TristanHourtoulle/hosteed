import { useState } from 'react'
import { FormData } from '../types'
import { TypeRentInterface } from '@/lib/interface/typeRentInterface'

const initialFormData: FormData = {
  name: '',
  description: '',
  address: '',
  completeAddress: '',
  placeId: '',
  phone: '',
  phoneCountry: 'MG',
  room: '',
  bathroom: '',
  arriving: '',
  leaving: '',
  basePrice: '',
  priceMGA: '',
  autoAccept: false,
  typeId: '',
  equipmentIds: [],
  mealIds: [],
  securityIds: [],
  serviceIds: [],
  includedServiceIds: [],
  extraIds: [],
  highlightIds: [],
  surface: '',
  maxPeople: '',
  accessibility: false,
  petFriendly: false,
  nearbyPlaces: [],
  proximityLandmarks: [],
  transportation: '',
  isHotel: false,
  hotelName: '',
  availableRooms: '',
}

export const useProductForm = (types: TypeRentInterface[], initialData?: FormData) => {
  const [formData, setFormData] = useState<FormData>(initialData || initialFormData)

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
      const newArray = currentArray.includes(id)
        ? currentArray.filter(item => item !== id)
        : [...currentArray, id]

      return {
        ...prev,
        [field]: newArray,
      }
    })
  }

  const resetForm = () => {
    setFormData(initialFormData)
  }

  return {
    formData,
    setFormData,
    handleInputChange,
    handleCheckboxChange,
    resetForm,
  }
}
