import { useState, useEffect } from 'react'
import { findAllTypeRent } from '@/lib/services/typeRent.service'
import { findAllEquipments } from '@/lib/services/equipments.service'
import { findAllMeals } from '@/lib/services/meals.service'
import { findAllServices } from '@/lib/services/services.service'
import { findAllSecurity } from '@/lib/services/security.services'
import { findAllUser } from '@/lib/services/user.service'
import { TypeRentInterface } from '@/lib/interface/typeRentInterface'
import {
  Equipment,
  Meal,
  Security,
  Service,
  IncludedService,
  ProductExtra,
  PropertyHighlight,
  SpecialPrice,
} from '../types'

export const useProductData = () => {
  const [types, setTypes] = useState<TypeRentInterface[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [securities, setSecurities] = useState<Security[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [includedServices, setIncludedServices] = useState<IncludedService[]>([])
  const [extras, setExtras] = useState<ProductExtra[]>([])
  const [highlights, setHighlights] = useState<PropertyHighlight[]>([])
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([])
  const [users, setUsers] = useState<{ id: string; email: string; name?: string | null }[]>([])

  // Load functions
  const loadIncludedServices = async (): Promise<IncludedService[]> => {
    const response = await fetch('/api/user/included-services')
    if (response.ok) {
      return await response.json()
    }
    return []
  }

  const loadExtras = async (): Promise<ProductExtra[]> => {
    const response = await fetch('/api/user/extras')
    if (response.ok) {
      return await response.json()
    }
    return []
  }

  const loadHighlights = async (): Promise<PropertyHighlight[]> => {
    const response = await fetch('/api/user/highlights')
    if (response.ok) {
      return await response.json()
    }
    return []
  }

  // Refresh functions
  const refreshIncludedServices = async () => {
    const data = await loadIncludedServices()
    setIncludedServices(data)
  }

  const refreshExtras = async () => {
    const data = await loadExtras()
    setExtras(data)
  }

  const refreshHighlights = async () => {
    const data = await loadHighlights()
    setHighlights(data)
  }

  // Initial data loading
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          typesData,
          equipmentsData,
          mealsData,
          securitiesData,
          servicesData,
          includedServicesData,
          extrasData,
          highlightsData,
          usersData,
        ] = await Promise.all([
          findAllTypeRent(),
          findAllEquipments(),
          findAllMeals(),
          findAllServices(),
          findAllSecurity(),
          loadIncludedServices(),
          loadExtras(),
          loadHighlights(),
          findAllUser(),
        ])

        setTypes(typesData)
        setEquipments(equipmentsData)
        setMeals(mealsData)
        setSecurities(securitiesData)
        setServices(servicesData)
        setIncludedServices(includedServicesData)
        setExtras(extrasData)
        setHighlights(highlightsData)
        setUsers(usersData || [])
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }

    fetchInitialData()
  }, [])

  return {
    types,
    equipments,
    meals,
    securities,
    services,
    includedServices,
    extras,
    highlights,
    specialPrices,
    users,
    setSpecialPrices,
    refreshIncludedServices,
    refreshExtras,
    refreshHighlights,
  }
}
