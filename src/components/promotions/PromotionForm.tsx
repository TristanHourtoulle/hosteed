'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { validatePromotionData } from '@/lib/utils/promotion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserCombobox } from '@/components/ui/UserCombobox'

interface Product {
  id: string
  name: string
  basePrice: string
  isHotel?: boolean
  roomTypes?: { id: string; name: string }[]
  owner?: {
    id: string
    name: string
    email: string
  }
}

/** Sentinel Select value for an establishment-wide promotion (roomTypeId = null). */
const ALL_ROOMS = '__ALL__'

interface User {
  id: string
  email: string
  name: string | null
  lastname: string | null
}

interface PromotionFormProps {
  products?: Product[]
  selectedProduct?: Product
  onSubmit: (data: {
    productId: string
    discountPercentage: number
    startDate: string
    endDate: string
    roomTypeId: string | null
  }) => Promise<void>
  loading?: boolean
  isAdminOrManager?: boolean
  currentUserId?: string
  users?: User[]
}

export default function PromotionForm({
  products = [],
  selectedProduct,
  onSubmit,
  loading = false,
  isAdminOrManager = false,
  currentUserId = '',
  users = [],
}: PromotionFormProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId)
  const [formData, setFormData] = useState({
    productId: selectedProduct?.id || '',
    discountPercentage: '',
    startDate: '',
    endDate: '',
    roomTypeId: ALL_ROOMS,
  })

  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null)
  const [savings, setSavings] = useState<number | null>(null)
  const [commissionValid, setCommissionValid] = useState<boolean | null>(null)
  const [checkingCommission, setCheckingCommission] = useState(false)

  // Filtrer les produits selon l'utilisateur sélectionné
  const filteredProducts = useMemo(() => {
    if (!isAdminOrManager) return products
    if (!selectedUserId) return products
    return products.filter(p => p.owner?.id === selectedUserId)
  }, [products, selectedUserId, isAdminOrManager])

  useEffect(() => {
    if (selectedProduct) {
      setFormData(prev => ({ ...prev, productId: selectedProduct.id }))
    }
  }, [selectedProduct])

  // Réinitialiser le produit sélectionné quand l'utilisateur change
  useEffect(() => {
    if (isAdminOrManager && selectedUserId) {
      setFormData(prev => ({ ...prev, productId: '' }))
    }
  }, [selectedUserId, isAdminOrManager])

  // Calculer le prix réduit et vérifier la commission
  useEffect(() => {
    console.log('🔄 [PromotionForm] useEffect triggered - calculating price and commission')
    console.log('📊 [PromotionForm] Current formData:', formData)

    const product = selectedProduct || products.find(p => p.id === formData.productId)
    console.log('📦 [PromotionForm] Found product:', product ? { id: product.id, name: product.name, basePrice: product.basePrice } : 'none')

    if (product && formData.discountPercentage) {
      const basePrice = parseFloat(product.basePrice)
      const discount = parseFloat(formData.discountPercentage)
      console.log('💰 [PromotionForm] Parsed values:', { basePrice, discount })

      if (!isNaN(basePrice) && !isNaN(discount) && discount > 0) {
        const newPrice = basePrice * (1 - discount / 100)
        const saved = basePrice - newPrice
        console.log('💵 [PromotionForm] Calculated:', { newPrice, saved })

        setDiscountedPrice(newPrice)
        setSavings(saved)

        // Vérifier la commission (per-type base price when scoped to a room type)
        console.log('🔍 [PromotionForm] Calling checkCommission...')
        checkCommission(
          formData.productId,
          discount,
          formData.roomTypeId === ALL_ROOMS ? null : formData.roomTypeId
        )
      } else {
        console.log('⚠️ [PromotionForm] Invalid values - resetting price calculations')
        setDiscountedPrice(null)
        setSavings(null)
        setCommissionValid(null)
      }
    } else {
      console.log('⚠️ [PromotionForm] No product or discount percentage - skipping calculations')
    }
  }, [formData.discountPercentage, formData.productId, formData.roomTypeId, products, selectedProduct])

  const checkCommission = async (
    productId: string,
    discount: number,
    roomTypeId: string | null
  ) => {
    if (!productId || !discount) return

    console.log('🔍 [PromotionForm] checkCommission called with:', { productId, discount, roomTypeId })
    setCheckingCommission(true)
    try {
      const requestBody = { productId, discountPercentage: discount, roomTypeId }
      console.log('📤 [PromotionForm] Sending request to /api/promotions/validate-commission:', requestBody)

      const res = await fetch('/api/promotions/validate-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      console.log('📥 [PromotionForm] Response status:', res.status)
      const data = await res.json()
      console.log('📥 [PromotionForm] Response data:', data)

      setCommissionValid(data.valid)

      if (!data.valid) {
        console.warn('⚠️ [PromotionForm] Commission validation failed:', data.message)
        toast.warning(data.message)
      } else {
        console.log('✅ [PromotionForm] Commission validation passed')
      }
    } catch (error) {
      console.error('❌ [PromotionForm] Erreur lors de la validation de la commission:', error)
    } finally {
      setCheckingCommission(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (
      !formData.productId ||
      !formData.discountPercentage ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast.error('Tous les champs sont requis')
      return
    }

    const discount = parseFloat(formData.discountPercentage)
    if (isNaN(discount) || discount <= 0) {
      toast.error('Le pourcentage de réduction doit être supérieur à 0')
      return
    }

    // Validation des dates
    const validation = validatePromotionData({
      discountPercentage: discount,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    })

    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    // Vérifier la commission
    if (commissionValid === false) {
      toast.error('Cette réduction est trop importante pour la plateforme')
      return
    }

    await onSubmit({
      productId: formData.productId,
      discountPercentage: discount,
      startDate: formData.startDate,
      endDate: formData.endDate,
      roomTypeId: formData.roomTypeId === ALL_ROOMS ? null : formData.roomTypeId,
    })
  }

  const selectedProductData = selectedProduct || products.find(p => p.id === formData.productId)
  const roomTypeOptions = selectedProductData?.isHotel ? selectedProductData.roomTypes ?? [] : []

  // Vérifier si tous les champs sont remplis
  const isFormValid =
    formData.productId !== '' &&
    formData.discountPercentage !== '' &&
    parseFloat(formData.discountPercentage) > 0 &&
    parseFloat(formData.discountPercentage) <= 90 &&
    formData.startDate !== '' &&
    formData.endDate !== '' &&
    commissionValid !== false

  return (
    <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-6'>
      {/* Sélection de l'utilisateur (admin/host manager uniquement) */}
      {isAdminOrManager && users.length > 0 && (
        <div className='space-y-2 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
          <Label className='text-sm sm:text-base text-amber-900'>
            Utilisateur <span className='text-red-500'>*</span>
          </Label>
          <UserCombobox
            users={users}
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            placeholder='Sélectionner un utilisateur...'
            className='w-full'
          />
          <p className='text-xs text-amber-700'>
            Sélectionnez l&apos;utilisateur pour lequel créer la promotion
          </p>
        </div>
      )}

      {/* Sélection du produit */}
      {!selectedProduct && filteredProducts.length > 0 && (
        <div className='space-y-2'>
          <Label htmlFor='product' className='text-sm sm:text-base'>
            Produit <span className='text-red-500'>*</span>
          </Label>
          <Select
            value={formData.productId}
            onValueChange={value =>
              setFormData({ ...formData, productId: value, roomTypeId: ALL_ROOMS })
            }
          >
            <SelectTrigger id='product' className='w-full'>
              <SelectValue placeholder='Sélectionner un produit' />
            </SelectTrigger>
            <SelectContent className='max-w-[calc(100vw-2rem)] sm:max-w-lg'>
              {filteredProducts.map(product => (
                <SelectItem key={product.id} value={product.id} className='max-w-full'>
                  <div className='flex items-baseline gap-2 truncate'>
                    <span className='font-medium truncate flex-1'>{product.name}</span>
                    <span className='text-sm text-gray-600 whitespace-nowrap'>
                      {product.basePrice}€
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Message si aucun produit disponible pour l'utilisateur sélectionné */}
      {isAdminOrManager && selectedUserId && filteredProducts.length === 0 && !selectedProduct && (
        <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg text-center'>
          <p className='text-sm text-gray-600'>
            Aucun produit disponible pour cet utilisateur
          </p>
        </div>
      )}

      {selectedProductData && (
        <div className='p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg'>
          <div className='text-xs sm:text-sm text-blue-700 font-medium mb-1'>
            Produit sélectionné
          </div>
          <div className='font-semibold text-sm sm:text-base text-blue-900'>
            {selectedProductData.name}
          </div>
          <div className='text-xs sm:text-sm text-blue-700'>
            Prix de base : {selectedProductData.basePrice}€ / nuit
          </div>
        </div>
      )}

      {/* Type de chambre (hôtel multi-type uniquement) */}
      {roomTypeOptions.length > 0 && (
        <div className='space-y-2'>
          <Label htmlFor='roomType' className='text-sm sm:text-base'>
            Type de chambre
          </Label>
          <Select
            value={formData.roomTypeId}
            onValueChange={value => setFormData({ ...formData, roomTypeId: value })}
          >
            <SelectTrigger id='roomType' className='w-full'>
              <SelectValue placeholder="Tout l'établissement" />
            </SelectTrigger>
            <SelectContent className='max-w-[calc(100vw-2rem)] sm:max-w-lg'>
              <SelectItem value={ALL_ROOMS}>Tout l&apos;établissement</SelectItem>
              {roomTypeOptions.map(roomType => (
                <SelectItem key={roomType.id} value={roomType.id}>
                  {roomType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-xs text-gray-500'>
            Laissez « Tout l&apos;établissement » pour appliquer la promotion à toutes les chambres.
          </p>
        </div>
      )}

      {/* Pourcentage de réduction */}
      <div className='space-y-2'>
        <Label htmlFor='discount' className='text-sm sm:text-base'>
          Pourcentage de réduction <span className='text-red-500'>*</span>
        </Label>
        <div className='relative'>
          <Input
            id='discount'
            type='number'
            min='1'
            max='90'
            step='1'
            value={formData.discountPercentage}
            onChange={e => setFormData({ ...formData, discountPercentage: e.target.value })}
            placeholder='Ex: 15'
            className='pr-12'
            disabled={loading}
          />
          <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm sm:text-base'>
            %
          </span>
        </div>
        {discountedPrice !== null && savings !== null && (
          <div className='mt-2 p-3 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2'>
              <div>
                <div className='text-xs text-green-700'>Nouveau prix</div>
                <div className='font-bold text-lg sm:text-xl text-green-800'>
                  {discountedPrice < 0 ? (
                    <span className='text-orange-600'>Gratuit + {Math.abs(discountedPrice).toFixed(2)}€ offerts</span>
                  ) : (
                    `${discountedPrice.toFixed(2)}€`
                  )}
                </div>
              </div>
              <div className='text-right'>
                <div className='text-xs text-green-700'>
                  {savings > 0 ? 'Économie' : 'Coût supplémentaire'}
                </div>
                <div className={`font-semibold text-base sm:text-lg ${savings > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {savings > 0 ? `-${savings.toFixed(2)}€` : `+${Math.abs(savings).toFixed(2)}€`}
                </div>
              </div>
            </div>
            {commissionValid === false && (
              <div className='mt-2 text-xs text-red-600 font-medium'>
                ⚠️ Réduction trop importante pour la plateforme
              </div>
            )}
            {checkingCommission && (
              <div className='mt-2 text-xs text-gray-600'>Vérification de la commission...</div>
            )}
          </div>
        )}
      </div>

      {/* Dates */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='startDate' className='text-sm sm:text-base'>
            Date de début <span className='text-red-500'>*</span>
          </Label>
          <Input
            id='startDate'
            type='date'
            value={formData.startDate}
            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            disabled={loading}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='endDate' className='text-sm sm:text-base'>
            Date de fin <span className='text-red-500'>*</span>
          </Label>
          <Input
            id='endDate'
            type='date'
            value={formData.endDate}
            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
            min={formData.startDate || new Date().toISOString().split('T')[0]}
            disabled={loading}
          />
        </div>
      </div>

      {/* Submit button */}
      <Button
        type='submit'
        className='w-full sm:w-auto'
        disabled={loading || !isFormValid}
      >
        {loading ? 'Création en cours...' : 'Créer la promotion'}
      </Button>
    </form>
  )
}
