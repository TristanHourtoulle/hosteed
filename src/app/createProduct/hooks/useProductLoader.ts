import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FormData, ImageFile, SpecialPrice } from '../types'

interface ProductImage {
  id: string
  img: string
}

interface LoadedProduct {
  formData: FormData
  images: ImageFile[]
  specialPrices: SpecialPrice[]
  isLoading: boolean
  error: string | null
}

/**
 * Custom hook for loading existing product data for editing
 */
export const useProductLoader = (productId?: string) => {
  const router = useRouter()
  const [loadedProduct, setLoadedProduct] = useState<LoadedProduct>({
    formData: {
      name: '',
      description: '',
      address: '',
      placeId: '',
      phone: '',
      phoneCountry: 'MG',
      arriving: '15',
      leaving: '12',
      basePrice: '',
      priceMGA: '',
      autoAccept: false,
      typeId: '',
      equipmentIds: [],
      mealIds: [],
      securityIds: [],
      serviceIds: [],
      includedServiceIds: [],
      extraIds: [],
      highlightIds: [],
      nearbyPlaces: [],
      transportation: '',
      room: '',
      bathroom: '',
      surface: '',
      maxPeople: '',
      accessibility: false,
      petFriendly: false,
      isHotel: false,
      hotelName: '',
      availableRooms: '',
    },
    images: [],
    specialPrices: [],
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    if (!productId) {
      setLoadedProduct(prev => ({ ...prev, isLoading: false }))
      return
    }

    const loadProduct = async () => {
      try {
        // Fetch product data
        const response = await fetch(`/api/products/${productId}`)
        if (!response.ok) {
          throw new Error('Produit non trouvé')
        }

        const product = await response.json()

        // Transform product data to form format
        const formData: FormData = {
          name: product.name || '',
          description: product.description || '',
          address: product.address || '',
          placeId: product.placeId || '',
          phone: product.phone || '',
          phoneCountry: product.phoneCountry || 'MG',
          arriving: product.arriving?.toString() || '15',
          leaving: product.leaving?.toString() || '12',
          basePrice: product.basePrice || '',
          priceMGA: product.priceMGA || '',
          autoAccept: product.autoAccept || false,
          typeId: product.typeId || '',
          equipmentIds: product.equipments?.map((e: { id: string }) => e.id) || [],
          mealIds: product.mealsList?.map((m: { id: string }) => m.id) || [],
          securityIds: product.securities?.map((s: { id: string }) => s.id) || [],
          serviceIds: product.servicesList?.map((s: { id: string }) => s.id) || [],
          includedServiceIds: product.includedServices?.map((s: { id: string }) => s.id) || [],
          extraIds: product.extras?.map((e: { id: string }) => e.id) || [],
          highlightIds: product.highlights?.map((h: { id: string }) => h.id) || [],
          nearbyPlaces: product.nearbyPlaces?.map((p: { name: string; distance: number }) => ({
            name: p.name,
            distance: p.distance?.toString() || '',
            unit: p.distance && p.distance < 1000 ? 'mètres' : 'kilomètres',
          })) || [],
          transportation: product.transportOptions?.[0]?.name || '',
          room: product.room?.toString() || '',
          bathroom: product.bathroom?.toString() || '',
          surface: product.surface?.toString() || '',
          maxPeople: product.maxPeople?.toString() || '',
          accessibility: product.propertyInfo?.hasHandicapAccess || false,
          petFriendly: product.propertyInfo?.hasPetsOnProperty || false,
          isHotel: !!product.hotel,
          hotelName: product.hotel?.name || '',
          availableRooms: product.availableRooms?.toString() || '',
        }

        // Transform images to ImageFile format
        // Mark existing images with isExisting flag to prevent re-upload
        const images: ImageFile[] = product.img?.map((img: ProductImage, index: number) => ({
          id: img.id,
          file: null, // No file object for existing images
          preview: img.img, // URL of the existing image
          url: img.img, // Keep original URL
          isExisting: true, // Flag to prevent re-upload
          order: index,
        })) || []

        setLoadedProduct({
          formData,
          images,
          specialPrices: product.specialPrices || [],
          isLoading: false,
          error: null,
        })
      } catch (error) {
        console.error('Error loading product:', error)
        toast.error('Erreur lors du chargement du produit')
        setLoadedProduct(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        }))
        router.push('/dashboard/host')
      }
    }

    loadProduct()
  }, [productId, router])

  return loadedProduct
}
