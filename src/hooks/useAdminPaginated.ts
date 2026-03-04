'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Product, User, RentStatus, PaymentStatus } from '@prisma/client'

interface PaginationInfo {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  hasNext: boolean
  hasPrev: boolean
}

interface AdminReservation {
  id: string
  arrivingDate: string
  leavingDate: string
  status: RentStatus
  payment: PaymentStatus
  totalAmount: number | null
  numberOfNights: number | null
  numberPeople: number | null
  createdAt: string
  accepted: boolean
  confirmed: boolean
  product: {
    id: string
    name: string
    address: string
    owner: { id: string; name: string | null; email: string }
  }
  user: {
    id: string
    name: string | null
    lastname: string | null
    email: string
  }
}

interface AdminReservationsResult {
  reservations: AdminReservation[]
  stats: Record<string, number>
  pagination: PaginationInfo
}

interface ExtendedProduct extends Product {
  img?: Array<{ img: string }>
}

interface AdminProductsResult {
  products: ExtendedProduct[]
  pagination: PaginationInfo
}

interface AdminUsersResult {
  users: User[]
  pagination: PaginationInfo
}

export function useAdminProductsPaginated() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20) // Optimized for admin performance
  const [searchTerm, setSearchTerm] = useState('')

  // Build search parameters for backend
  const searchParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', currentPage.toString())
    params.set('limit', itemsPerPage.toString())
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    }
    return params.toString()
  }, [currentPage, itemsPerPage, searchTerm])

  const {
    data: result,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<AdminProductsResult>({
    queryKey: ['admin-products', searchParams],
    queryFn: async () => {
      const response = await fetch(`/api/admin/products?${searchParams}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  const goToPage = (page: number) => {
    if (page >= 1 && page <= (result?.pagination.totalPages || 1)) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page when searching
  }

  return {
    products: result?.products || [],
    pagination: result?.pagination || {
      currentPage: 1,
      totalPages: 1,
      itemsPerPage,
      totalItems: 0,
      hasNext: false,
      hasPrev: false,
    },
    loading: isLoading,
    isFetching,
    error,
    searchTerm,
    handleSearch,
    goToPage,
    nextPage,
    prevPage,
    refetch,
  }
}

export function useAdminUsersPaginated() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20) // Optimized for admin performance
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')

  // Build search parameters for backend
  const searchParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', currentPage.toString())
    params.set('limit', itemsPerPage.toString())
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    }
    if (roleFilter) {
      params.set('role', roleFilter)
    }
    return params.toString()
  }, [currentPage, itemsPerPage, searchTerm, roleFilter])

  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery<AdminUsersResult>({
    queryKey: ['admin-users', searchParams],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users?${searchParams}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  })

  const goToPage = (page: number) => {
    if (page >= 1 && page <= (result?.pagination.totalPages || 1)) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role)
    setCurrentPage(1) // Reset to first page when filtering
  }

  return {
    users: result?.users || [],
    pagination: result?.pagination || {
      currentPage: 1,
      totalPages: 1,
      itemsPerPage,
      totalItems: 0,
      hasNext: false,
      hasPrev: false,
    },
    loading: isLoading,
    error,
    searchTerm,
    roleFilter,
    handleSearch,
    handleRoleFilter,
    goToPage,
    nextPage,
    prevPage,
    refetch,
  }
}

export function useAdminReservationsPaginated() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const searchParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', currentPage.toString())
    params.set('limit', itemsPerPage.toString())
    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim())
    }
    if (statusFilter) {
      params.set('status', statusFilter)
    }
    return params.toString()
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter])

  const {
    data: result,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<AdminReservationsResult>({
    queryKey: ['admin-reservations', searchParams],
    queryFn: async () => {
      const response = await fetch(`/api/admin/reservations?${searchParams}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  const goToPage = (page: number) => {
    if (page >= 1 && page <= (result?.pagination.totalPages || 1)) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

  const handleSearch = (term: string) => {
    setSearchInput(term)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  return {
    reservations: result?.reservations || [],
    stats: result?.stats || { WAITING: 0, RESERVED: 0, CHECKIN: 0, CHECKOUT: 0, CANCEL: 0, total: 0 },
    pagination: result?.pagination || {
      currentPage: 1,
      totalPages: 1,
      itemsPerPage,
      totalItems: 0,
      hasNext: false,
      hasPrev: false,
    },
    loading: isLoading,
    isFetching,
    error,
    searchTerm: searchInput,
    statusFilter,
    handleSearch,
    handleStatusFilter,
    goToPage,
    nextPage,
    prevPage,
    refetch,
  }
}
