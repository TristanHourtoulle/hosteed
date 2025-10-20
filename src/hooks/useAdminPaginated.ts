'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Product, User } from '@prisma/client'

interface PaginationInfo {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  hasNext: boolean
  hasPrev: boolean
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
