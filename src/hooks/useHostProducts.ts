import { useQuery } from '@tanstack/react-query'
import { ProductValidation } from '@prisma/client'

interface ProductPromotion {
  id: string
  discountPercentage: number
  startDate: Date
  endDate: Date
  isActive: boolean
}

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  validate: ProductValidation
  isDraft?: boolean
  originalProductId?: string | null
  img?: { img: string }[]
  promotions?: ProductPromotion[]
}

interface HostProductsResponse {
  products: Product[]
  totalPages: number
  currentPage: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

async function fetchHostProducts(
  page: number = 1,
  limit: number = 20
): Promise<HostProductsResponse> {
  const response = await fetch(`/api/host/products?page=${page}&limit=${limit}`)

  if (!response.ok) {
    throw new Error('Erreur lors du chargement des produits')
  }

  return response.json()
}

export function useHostProducts(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['host-products', page, limit],
    queryFn: () => fetchHostProducts(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: previousData => previousData, // Garde les données précédentes pendant le chargement
  })
}
