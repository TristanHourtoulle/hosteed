import { useState, useEffect } from 'react'
import { findAllTypeRent } from '@/lib/services/typeRent.service'
import { findAllEquipments } from '@/lib/services/equipments.service'
import { findAllMeals } from '@/lib/services/meals.service'
import { findAllServices } from '@/lib/services/services.service'
import { findAllSecurity } from '@/lib/services/security.services'
import { loadIncludedServices, loadExtras, loadHighlights } from '../utils'
import type {
  Equipment,
  Meal,
  Security,
  Service,
  IncludedService,
  ProductExtra,
  PropertyHighlight,
} from '../types'
import type { TypeRentInterface } from '@/lib/interface/typeRentInterface'
import type { ErrorDetails } from '@/components/ui/ErrorAlert'

export const useProductEditData = () => {
  const [types, setTypes] = useState<TypeRentInterface[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [securities, setSecurities] = useState<Security[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [includedServices, setIncludedServices] = useState<IncludedService[]>([])
  const [extras, setExtras] = useState<ProductExtra[]>([])
  const [highlights, setHighlights] = useState<PropertyHighlight[]>([])
  const [error, setError] = useState<ErrorDetails | null>(null)

  useEffect(() => {
    const loadData = async () => {
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
        ] = await Promise.all([
          findAllTypeRent(),
          findAllEquipments(),
          findAllMeals(),
          findAllSecurity(),
          findAllServices(),
          loadIncludedServices(),
          loadExtras(),
          loadHighlights(),
        ])

        setTypes(typesData || [])
        setEquipments(equipmentsData || [])
        setMeals(mealsData || [])
        setSecurities(securitiesData || [])
        setServices(servicesData || [])
        setIncludedServices(includedServicesData || [])
        setExtras(extrasData || [])
        setHighlights(highlightsData || [])
      } catch (error) {
        console.error('Error loading data:', error)
        setError({
          type: 'network',
          title: 'Erreur de chargement',
          message: "Impossible de charger les données nécessaires à l'édition.",
          details: [
            "Échec du chargement des types d'hébergement, équipements ou services",
            'Vérifiez votre connexion internet',
          ],
          suggestions: [
            'Actualisez la page pour réessayer',
            'Vérifiez votre connexion internet',
            'Si le problème persiste, contactez le support',
          ],
          retryable: true,
        })
      }
    }

    loadData()
  }, [])

  const handleServiceCreated = (newService: IncludedService) => {
    setIncludedServices(prev => [...prev, newService])
  }

  const handleExtraCreated = (newExtra: ProductExtra) => {
    setExtras(prev => [...prev, newExtra])
  }

  const handleHighlightCreated = (newHighlight: PropertyHighlight) => {
    setHighlights(prev => [...prev, newHighlight])
  }

  return {
    types,
    equipments,
    meals,
    securities,
    services,
    includedServices,
    extras,
    highlights,
    error,
    setError,
    handleServiceCreated,
    handleExtraCreated,
    handleHighlightCreated,
  }
}
