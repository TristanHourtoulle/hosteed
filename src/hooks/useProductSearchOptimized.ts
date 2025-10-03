'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useQueries } from '@tanstack/react-query'
import { CACHE_TAGS } from '@/lib/cache/query-client'
import { findAllProducts } from '@/lib/services/product.service'
import { findAllTypeRent } from '@/lib/services/typeRent.service'
import { findAllSecurity } from '@/lib/services/security.services'
import { findAllMeals } from '@/lib/services/meals.service'
import { findAllEquipments } from '@/lib/services/equipments.service'
import { findAllServices } from '@/lib/services/services.service'
import { sortProductsWithSponsoredFirst } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string
  address: string
  longitude: number
  latitude: number
  img?: { img: string }[]
  basePrice: string
  equipments?: { id: string; name: string }[]
  servicesList?: { id: string; name: string }[]
  mealsList?: { id: string; name: string }[]
  securities?: { id: string; name: string }[]
  arriving: number
  leaving: number
  typeRentId?: string
  certified?: boolean
  isCertificated?: boolean
  validate?: string
  room?: bigint | null
  bathroom?: bigint | null
  minPeople?: bigint | null
  maxPeople?: bigint | null
  sizeRoom?: number | null
  autoAccept?: boolean
  contract?: boolean
  PromotedProduct?: Array<{
    id: string
    active: boolean
    start: Date
    end: Date
  }>
}

interface Suggestion {
  display_name: string
  lat: string
  lon: string
}

interface FilterState {
  selectedSecurities: string[]
  selectedMeals: string[]
  selectedEquipments: string[]
  selectedServices: string[]
  selectedTypeRooms: string[]
  searchRadius: number
  arrivingDate: string
  leavingDate: string
  minPrice: string
  maxPrice: string
  minPeople: string
  maxPeople: string
  minRooms: string
  maxRooms: string
  minBathrooms: string
  maxBathrooms: string
  sizeMin: string
  sizeMax: string
  certifiedOnly: boolean
}

export function useProductSearchOptimized() {
  const searchParams = useSearchParams()

  // Get URL parameters
  const typeRentId = searchParams.get('type') || searchParams.get('typeRent') || ''
  const searchQuery = searchParams.get('q') || searchParams.get('location') || ''
  const featured = searchParams.get('featured') === 'true'
  const popular = searchParams.get('popular') === 'true'
  const recent = searchParams.get('recent') === 'true'
  const promo = searchParams.get('promo') === 'true'

  // Search state
  const [location, setLocation] = useState(searchQuery)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedType, setSelectedType] = useState(typeRentId)
  const [guests, setGuests] = useState(1)

  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    selectedSecurities: [],
    selectedMeals: [],
    selectedEquipments: [],
    selectedServices: [],
    selectedTypeRooms: [],
    searchRadius: 50,
    arrivingDate: '',
    leavingDate: '',
    minPrice: '',
    maxPrice: '',
    minPeople: '',
    maxPeople: '',
    minRooms: '',
    maxRooms: '',
    minBathrooms: '',
    maxBathrooms: '',
    sizeMin: '',
    sizeMax: '',
    certifiedOnly: false,
  })

  // Use React Query for static data with long cache times
  const staticQueries = useQueries({
    queries: [
      {
        queryKey: ['typeRent'],
        queryFn: findAllTypeRent,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
      {
        queryKey: CACHE_TAGS.staticData.security,
        queryFn: findAllSecurity,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24 * 7,
      },
      {
        queryKey: CACHE_TAGS.staticData.meals,
        queryFn: findAllMeals,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24 * 7,
      },
      {
        queryKey: CACHE_TAGS.staticData.equipments,
        queryFn: findAllEquipments,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24 * 7,
      },
      {
        queryKey: CACHE_TAGS.staticData.services,
        queryFn: findAllServices,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24 * 7,
      },
    ],
  })

  const [typeRentQuery, securityQuery, mealsQuery, equipmentsQuery, servicesQuery] = staticQueries

  const typeRent = typeRentQuery.data || []
  const securities = securityQuery.data || []
  const meals = mealsQuery.data || []
  const equipments = equipmentsQuery.data || []
  const services = servicesQuery.data || []

  // Use React Query for products with shorter cache time
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: CACHE_TAGS.products,
    queryFn: findAllProducts,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })

  // Filter products using useMemo for optimization
  const filteredProducts = useMemo(() => {
    if (!allProducts) return []

    // Handle both array and paginated response formats
    const productsArray = Array.isArray(allProducts)
      ? allProducts
      : allProducts.products || []

    if (productsArray.length === 0) return []

    let filtered = (productsArray as unknown as Product[]).filter((product: Product) => {
      const matchesTypeRent = !selectedType || product.typeRentId === selectedType
      const matchesSearch =
        !location ||
        product.name.toLowerCase().includes(location.toLowerCase()) ||
        product.description.toLowerCase().includes(location.toLowerCase()) ||
        product.address.toLowerCase().includes(location.toLowerCase())

      const matchesEquipments =
        filters.selectedEquipments.length === 0 ||
        filters.selectedEquipments.every(equipmentId =>
          product.equipments?.some(equipment => equipment.id === equipmentId)
        )

      const matchesServices =
        filters.selectedServices.length === 0 ||
        filters.selectedServices.every(serviceId =>
          product.servicesList?.some(service => service.id === serviceId)
        )

      const matchesMeals =
        filters.selectedMeals.length === 0 ||
        filters.selectedMeals.every(mealId => product.mealsList?.some(meal => meal.id === mealId))

      let matchesSecurities = true
      if (filters.selectedSecurities.length > 0) {
        if (!product.securities || product.securities.length === 0) {
          matchesSecurities = false
        } else {
          matchesSecurities = filters.selectedSecurities.every(securityId =>
            product.securities?.some(security => security.id === securityId)
          )
        }
      }

      const matchesDates =
        !filters.arrivingDate ||
        !filters.leavingDate ||
        typeof product.arriving === 'number' ||
        typeof product.leaving === 'number' ||
        (new Date(product.arriving) <= new Date(filters.arrivingDate) &&
          new Date(product.leaving) >= new Date(filters.leavingDate))

      const price = parseFloat(product.basePrice)
      const matchesPrice =
        (!filters.minPrice || price >= parseFloat(filters.minPrice)) &&
        (!filters.maxPrice || price <= parseFloat(filters.maxPrice))

      const matchesPeople =
        (!filters.minPeople ||
          !product.minPeople ||
          Number(product.minPeople) >= parseInt(filters.minPeople)) &&
        (!filters.maxPeople ||
          !product.maxPeople ||
          Number(product.maxPeople) <= parseInt(filters.maxPeople))

      const matchesRooms =
        (!filters.minRooms ||
          !product.room ||
          Number(product.room) >= parseInt(filters.minRooms)) &&
        (!filters.maxRooms || !product.room || Number(product.room) <= parseInt(filters.maxRooms))

      const matchesBathrooms =
        (!filters.minBathrooms ||
          !product.bathroom ||
          Number(product.bathroom) >= parseInt(filters.minBathrooms)) &&
        (!filters.maxBathrooms ||
          !product.bathroom ||
          Number(product.bathroom) <= parseInt(filters.maxBathrooms))

      const matchesSize =
        (!filters.sizeMin || !product.sizeRoom || product.sizeRoom >= parseInt(filters.sizeMin)) &&
        (!filters.sizeMax || !product.sizeRoom || product.sizeRoom <= parseInt(filters.sizeMax))

      const matchesSpecialOptions =
        (!filters.certifiedOnly || product.isCertificated)

      return (
        matchesTypeRent &&
        matchesSearch &&
        matchesEquipments &&
        matchesServices &&
        matchesMeals &&
        matchesSecurities &&
        matchesDates &&
        matchesPrice &&
        matchesPeople &&
        matchesRooms &&
        matchesBathrooms &&
        matchesSize &&
        matchesSpecialOptions
      )
    })

    // Apply special filters
    if (featured) {
      filtered = filtered.filter(product => product.isCertificated || product.validate === 'Approve')
    }

    if (popular) {
      filtered = filtered.sort((a, b) => {
        const aScore = (a.equipments?.length || 0) + (a.servicesList?.length || 0)
        const bScore = (b.equipments?.length || 0) + (b.servicesList?.length || 0)
        return bScore - aScore
      })
    }

    if (recent) {
      filtered = filtered.sort((a, b) => b.id.localeCompare(a.id))
    }

    if (promo) {
      filtered = filtered.filter(product => {
        const price = parseFloat(product.basePrice)
        return price < 100
      })
    }

    // Always sort with sponsored products first
    return sortProductsWithSponsoredFirst(filtered)
  }, [allProducts, selectedType, location, filters, featured, popular, recent, promo])

  // Location suggestions with debounce
  useEffect(() => {
    if (location.length < 3) {
      setSuggestions([])
      return
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=5`
        )
        const data = await response.json()
        setSuggestions(data)
        setShowSuggestions(true)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      }
    }, 300)
  }, [location])

  const handleModernSearch = (data: {
    location: string
    checkIn: string
    checkOut: string
    guests: number
  }) => {
    setLocation(data.location)
    if (data.checkIn) {
      setFilters(prev => ({ ...prev, arrivingDate: data.checkIn }))
    }
    if (data.checkOut) {
      setFilters(prev => ({ ...prev, leavingDate: data.checkOut }))
    }
    if (data.guests) {
      setGuests(data.guests)
    }
    setShowSuggestions(false)
  }

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked
        ? [...(prev[filterType as keyof typeof prev] as string[]), value]
        : (prev[filterType as keyof typeof prev] as string[]).filter(id => id !== value),
    }))
  }

  const resetFilters = () => {
    setSelectedType('')
    setLocation('')
    setGuests(1)
    setFilters({
      selectedSecurities: [],
      selectedMeals: [],
      selectedEquipments: [],
      selectedServices: [],
      selectedTypeRooms: [],
      searchRadius: 50,
      arrivingDate: '',
      leavingDate: '',
      minPrice: '',
      maxPrice: '',
      minPeople: '',
      maxPeople: '',
      minRooms: '',
      maxRooms: '',
      minBathrooms: '',
      maxBathrooms: '',
      sizeMin: '',
      sizeMax: '',
      certifiedOnly: false,
    })
  }

  const loading = staticQueries.some(q => q.isLoading) || productsLoading
  const error = staticQueries.some(q => q.isError) ? 'Erreur lors du chargement des données' : null

  return {
    // State
    products: filteredProducts,
    loading,
    error,
    location,
    suggestions,
    showSuggestions,
    selectedType,
    typeRent,
    filters,
    securities,
    meals,
    equipments,
    services,
    featured,
    popular,
    recent,
    promo,
    guests,

    // Actions
    setLocation,
    setShowSuggestions,
    setSelectedType,
    setFilters,
    handleModernSearch,
    handleFilterChange,
    resetFilters,
  }
}
