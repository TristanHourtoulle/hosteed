import { useQuery, useQueries } from '@tanstack/react-query'
import { CACHE_TAGS } from '@/lib/cache/query-client'
import { Equipment, Meals, Security, Services } from '@prisma/client'

const fetchEquipments = async (): Promise<Equipment[]> => {
  const response = await fetch('/api/equipments')
  if (!response.ok) throw new Error('Failed to fetch equipments')
  return response.json()
}

const fetchMeals = async (): Promise<Meals[]> => {
  const response = await fetch('/api/meals')
  if (!response.ok) throw new Error('Failed to fetch meals')
  return response.json()
}

const fetchServices = async (): Promise<Services[]> => {
  const response = await fetch('/api/services')
  if (!response.ok) throw new Error('Failed to fetch services')
  return response.json()
}

const fetchSecurity = async (): Promise<Security[]> => {
  const response = await fetch('/api/security')
  if (!response.ok) throw new Error('Failed to fetch security')
  return response.json()
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
    ],
  })

  return {
    equipments: queries[0],
    meals: queries[1],
    services: queries[2],
    security: queries[3],
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
  }
}