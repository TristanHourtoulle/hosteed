'use client'
import { useState, useEffect, useRef } from 'react'
import { TypeRent } from '@prisma/client'
import { useSearchParams } from 'next/navigation'
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

export function useProductSearch() {
  const searchParams = useSearchParams()

  const [typeRent, setTypeRent] = useState<TypeRent[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  const [securities, setSecurities] = useState<{ id: string; name: string }[]>([])
  const [meals, setMeals] = useState<{ id: string; name: string }[]>([])
  const [equipments, setEquipments] = useState<{ id: string; name: string }[]>([])
  const [services, setServices] = useState<{ id: string; name: string }[]>([])
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

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [types, securityList, mealsList, equipmentsList, servicesList] = await Promise.all([
          findAllTypeRent(),
          findAllSecurity(),
          findAllMeals(),
          findAllEquipments(),
          findAllServices(),
        ])

        if (types) setTypeRent(types)
        if (securityList) setSecurities(securityList)
        if (mealsList) setMeals(mealsList)
        if (equipmentsList) setEquipments(equipmentsList)
        if (servicesList) setServices(servicesList)
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter products
  const filterProducts = (allProducts: Product[]) => {
    return allProducts.filter((product: Product) => {
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

      // Skip date filtering if product dates are just numbers (not proper dates)
      const matchesDates =
        !filters.arrivingDate ||
        !filters.leavingDate ||
        typeof product.arriving === 'number' ||
        typeof product.leaving === 'number' ||
        (new Date(product.arriving) <= new Date(filters.arrivingDate) &&
          new Date(product.leaving) >= new Date(filters.leavingDate))

      // New filters based on Prisma schema
      const price = parseFloat(product.basePrice)
      const matchesPrice =
        (!filters.minPrice || price >= parseFloat(filters.minPrice)) &&
        (!filters.maxPrice || price <= parseFloat(filters.maxPrice))

      // Vérification du nombre de personnes : le logement doit pouvoir accueillir au moins le nombre d'invités demandé
      const matchesPeople =
        // Si des invités sont spécifiés dans la recherche (barre de recherche moderne)
        (guests <= 1 || (product.maxPeople && Number(product.maxPeople) >= guests)) &&
        // Filtres avancés pour min/max people
        (!filters.minPeople ||
          !product.minPeople ||
          Number(product.minPeople) >= parseInt(filters.minPeople)) &&
        (!filters.maxPeople ||
          !product.maxPeople ||
          Number(product.maxPeople) >= parseInt(filters.maxPeople))

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
  }

  // Apply special filters
  const applySpecialFilters = (filteredProducts: Product[]) => {
    let result = [...filteredProducts]

    if (featured) {
      result = result.filter(product => product.certified || product.validate === 'Approve')
    }

    if (popular) {
      result = result.sort((a, b) => {
        const aScore = (a.equipments?.length || 0) + (a.servicesList?.length || 0)
        const bScore = (b.equipments?.length || 0) + (b.servicesList?.length || 0)
        return bScore - aScore
      })
    }

    if (recent) {
      result = result.sort((a, b) => b.id.localeCompare(a.id))
    }

    if (promo) {
      result = result.filter(product => {
        const price = parseFloat(product.basePrice)
        return price < 100
      })
    }

    // Always sort with sponsored products first
    result = sortProductsWithSponsoredFirst(result)

    return result
  }

  // Load and filter products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const allProducts = await findAllProducts()
        if (allProducts) {
          let filteredProducts = filterProducts(allProducts as unknown as Product[])
          filteredProducts = applySpecialFilters(filteredProducts)
          setProducts(filteredProducts)
        }
      } catch (error) {
        console.error('Error loading products:', error)
        setError('Erreur lors de la récupération des produits')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, location, filters, featured, popular, recent, promo, guests])

  // Location suggestions
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
    // Always set location, even if it's empty (to allow searching all locations)
    setLocation(data.location)
    if (data.checkIn) {
      setFilters(prev => ({ ...prev, arrivingDate: data.checkIn }))
    }
    if (data.checkOut) {
      setFilters(prev => ({ ...prev, leavingDate: data.checkOut }))
    }
    if (data.guests !== undefined && data.guests >= 0) {
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

  return {
    // State
    products,
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
