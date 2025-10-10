'use client'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useQueries } from '@tanstack/react-query'
import { CACHE_TAGS } from '@/lib/cache/query-client'
// Fetch functions for static data APIs
const fetchTypeRent = async () => {
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

const fetchSecurity = async () => {
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

const fetchMeals = async () => {
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

const fetchEquipments = async () => {
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

const fetchServices = async () => {
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
  autoAcceptOnly: boolean
  certifiedOnly: boolean
  contractRequired: boolean
}

interface ProductSearchResult {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function useProductSearchPaginated() {
  const searchParams = useSearchParams()

  // Get URL parameters
  const typeRentId = searchParams.get('type') || searchParams.get('typeRent') || ''
  const searchQuery = searchParams.get('q') || searchParams.get('location') || ''
  const featured = searchParams.get('featured') === 'true'
  const popular = searchParams.get('popular') === 'true'
  const recent = searchParams.get('recent') === 'true'
  const promo = searchParams.get('promo') === 'true'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20) // Optimized for performance
  
  // Search state
  const [searchTerm, setSearchTerm] = useState(searchQuery)
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
    autoAcceptOnly: false,
    certifiedOnly: false,
    contractRequired: false,
  })

  // Use React Query for static data with long cache times
  const staticQueries = useQueries({
    queries: [
      {
        queryKey: CACHE_TAGS.staticData.typeRent,
        queryFn: fetchTypeRent,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
      {
        queryKey: CACHE_TAGS.staticData.security,
        queryFn: fetchSecurity,
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
        queryKey: CACHE_TAGS.staticData.equipments,
        queryFn: fetchEquipments,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24 * 7,
      },
      {
        queryKey: CACHE_TAGS.staticData.services,
        queryFn: fetchServices,
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
  const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : []

  // Create optimized search parameters for backend filtering
  const searchParams_backend = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    typeRentId: selectedType,
    location: location,
    featured,
    popular,
    recent,
    promo,
    ...filters,
    // Convert guests to filter format
    ...(guests > 1 && { minPeople: guests.toString() })
  }), [
    currentPage, 
    itemsPerPage, 
    searchTerm, 
    selectedType, 
    location, 
    featured, 
    popular, 
    recent, 
    promo, 
    filters, 
    guests
  ])

  // Use React Query for paginated products with optimized backend search
  const {
    data: productResult,
    isLoading: productsLoading,
    error: productsError
  } = useQuery<ProductSearchResult | null>({
    queryKey: [
      'products-search',
      searchParams_backend
    ],
    queryFn: async () => {
      // Build search URL with all parameters
      const searchURL = new URL('/api/products/search', window.location.origin)
      searchURL.searchParams.set('page', currentPage.toString())
      searchURL.searchParams.set('limit', itemsPerPage.toString())

      if (searchTerm) searchURL.searchParams.set('search', searchTerm)
      if (selectedType) searchURL.searchParams.set('typeRentId', selectedType)
      if (location) searchURL.searchParams.set('location', location)
      if (featured) searchURL.searchParams.set('featured', 'true')
      if (popular) searchURL.searchParams.set('popular', 'true')
      if (recent) searchURL.searchParams.set('recent', 'true')
      if (promo) searchURL.searchParams.set('promo', 'true')

      // Add filter parameters
      if (filters.minPrice) searchURL.searchParams.set('minPrice', filters.minPrice)
      if (filters.maxPrice) searchURL.searchParams.set('maxPrice', filters.maxPrice)
      if (filters.minPeople) searchURL.searchParams.set('minPeople', filters.minPeople)
      if (filters.maxPeople) searchURL.searchParams.set('maxPeople', filters.maxPeople)
      if (filters.certifiedOnly) searchURL.searchParams.set('certifiedOnly', 'true')
      if (filters.autoAcceptOnly) searchURL.searchParams.set('autoAcceptOnly', 'true')
      if (guests > 1) searchURL.searchParams.set('minPeople', guests.toString())

      // Call optimized search API
      const response = await fetch(searchURL.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch search results')
      }

      const result = await response.json()
      if (!result) return null

      // Debug logging to check products structure
      console.log('API Response products:', result.products?.slice(0, 1))

      // Server already handles most filtering, just return the result
      return {
        products: result.products,
        pagination: result.pagination
      }
    },
    // ✅ PERFORMANCE FIX: Cache optimisé pour éviter les re-fetch
    staleTime: 1000 * 60 * 30, // 30 minutes (au lieu de 2min)
    gcTime: 1000 * 60 * 60 * 2, // 2 heures (au lieu de 5min)
    // ✅ CRITICAL FIX: Lancer en parallèle avec les données statiques !
    // Pas besoin d'attendre que types/equipments/etc soient chargés
    // Les produits et les filtres se chargent indépendamment
  })

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

  // Search functions
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page on search
  }, [])

  const handleModernSearch = useCallback((data: {
    location: string
    checkIn: string
    checkOut: string
    guests: number
  }) => {
    setLocation(data.location)
    setSearchTerm(data.location) // Also search by location term
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
    setCurrentPage(1) // Reset to first page on search
  }, [])

  // Pagination functions
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page)
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const goToNextPage = useCallback(() => {
    if (productResult?.pagination.hasNext) {
      goToPage(currentPage + 1)
    }
  }, [currentPage, productResult?.pagination.hasNext, goToPage])

  const goToPrevPage = useCallback(() => {
    if (productResult?.pagination.hasPrev) {
      goToPage(currentPage - 1)
    }
  }, [currentPage, productResult?.pagination.hasPrev, goToPage])

  // Filter functions
  const handleFilterChange = useCallback((filterType: string, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked
        ? [...(prev[filterType as keyof typeof prev] as string[]), value]
        : (prev[filterType as keyof typeof prev] as string[]).filter(id => id !== value),
    }))
    setCurrentPage(1) // Reset to first page on filter change
  }, [])

  const resetFilters = useCallback(() => {
    setSelectedType('')
    setLocation('')
    setSearchTerm('')
    setGuests(1)
    setCurrentPage(1)
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
      autoAcceptOnly: false,
      certifiedOnly: false,
      contractRequired: false,
    })
  }, [])

  const loading = staticQueries.some(q => q.isLoading) || productsLoading
  const error = staticQueries.some(q => q.isError) || productsError 
    ? 'Erreur lors du chargement des données' 
    : null

  return {
    // Data
    products: productResult?.products || [],
    pagination: productResult?.pagination,
    loading,
    error,
    
    // Search state
    searchTerm,
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

    // Pagination state
    currentPage,
    itemsPerPage,

    // Actions
    setLocation,
    setShowSuggestions,
    setSelectedType,
    setFilters,
    handleSearch,
    handleModernSearch,
    handleFilterChange,
    resetFilters,
    
    // Pagination actions
    goToPage,
    goToNextPage,
    goToPrevPage,
  }
}