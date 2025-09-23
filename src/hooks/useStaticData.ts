import { useQuery, useQueries } from '@tanstack/react-query'
import { CACHE_TAGS } from '@/lib/cache/query-client'
import { Equipment, Meals, Security, Services, TypeRent } from '@prisma/client'

const fetchEquipments = async (): Promise<Equipment[]> => {
  try {
    const response = await fetch('/api/equipments')
    if (!response.ok) throw new Error(`Failed to fetch equipments: ${response.status}`)
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching equipments:', error)
    return []
  }
}

const fetchMeals = async (): Promise<Meals[]> => {
  try {
    const response = await fetch('/api/meals')
    if (!response.ok) throw new Error(`Failed to fetch meals: ${response.status}`)
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching meals:', error)
    return []
  }
}

const fetchServices = async (): Promise<Services[]> => {
  try {
    const response = await fetch('/api/services')
    if (!response.ok) throw new Error(`Failed to fetch services: ${response.status}`)
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching services:', error)
    return []
  }
}

const fetchSecurity = async (): Promise<Security[]> => {
  try {
    const response = await fetch('/api/security')
    if (!response.ok) throw new Error(`Failed to fetch security: ${response.status}`)
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching security:', error)
    return []
  }
}

const fetchTypeRent = async (): Promise<TypeRent[]> => {
  try {
    const response = await fetch('/api/types')
    if (!response.ok) throw new Error(`Failed to fetch types: ${response.status}`)
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching typeRent:', error)
    return []
  }
}

export const useEquipments = () => {
  return useQuery({
    queryKey: CACHE_TAGS.staticData.equipments,
    queryFn: fetchEquipments,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  })
}

export const useMeals = () => {
  return useQuery({
    queryKey: CACHE_TAGS.staticData.meals,
    queryFn: fetchMeals,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  })
}

export const useServices = () => {
  return useQuery({
    queryKey: CACHE_TAGS.staticData.services,
    queryFn: fetchServices,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  })
}

export const useSecurity = () => {
  return useQuery({
    queryKey: CACHE_TAGS.staticData.security,
    queryFn: fetchSecurity,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  })
}

export const useTypeRent = () => {
  return useQuery({
    queryKey: CACHE_TAGS.staticData.typeRent,
    queryFn: fetchTypeRent,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  })
}

export const useAllStaticData = () => {
  const queries = useQueries({
    queries: [
      {
        queryKey: CACHE_TAGS.staticData.equipments,
        queryFn: fetchEquipments,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24 * 7,
      },
      {
        queryKey: CACHE_TAGS.staticData.meals,
        queryFn: fetchMeals,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24 * 7,
      },
      {
        queryKey: CACHE_TAGS.staticData.services,
        queryFn: fetchServices,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24 * 7,
      },
      {
        queryKey: CACHE_TAGS.staticData.security,
        queryFn: fetchSecurity,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24 * 7,
      },
      {
        queryKey: CACHE_TAGS.staticData.typeRent,
        queryFn: fetchTypeRent,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24 * 7,
      },
    ],
  })

  return {
    equipments: queries[0],
    meals: queries[1],
    services: queries[2],
    security: queries[3],
    typeRent: queries[4],
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
  }
}