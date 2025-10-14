'use client'

import { useState, useEffect } from 'react'
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

interface Product {
  id: string
  name: string
  basePrice: string
}

interface PromotionFormProps {
  products?: Product[]
  selectedProduct?: Product
  onSubmit: (data: {
    productId: string
    discountPercentage: number
    startDate: string
    endDate: string
  }) => Promise<void>
  loading?: boolean
}

export default function PromotionForm({
  products = [],
  selectedProduct,
  onSubmit,
  loading = false
}: PromotionFormProps) {
  const [formData, setFormData] = useState({
    productId: selectedProduct?.id || '',
    discountPercentage: '',
    startDate: '',
    endDate: ''
  })

  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null)
  const [savings, setSavings] = useState<number | null>(null)
  const [commissionValid, setCommissionValid] = useState<boolean | null>(null)
  const [checkingCommission, setCheckingCommission] = useState(false)

  useEffect(() => {
    if (selectedProduct) {
      setFormData((prev) => ({ ...prev, productId: selectedProduct.id }))
    }
  }, [selectedProduct])

  // Calculer le prix réduit et vérifier la commission
  useEffect(() => {
    const product = selectedProduct || products.find((p) => p.id === formData.productId)
    if (product && formData.discountPercentage) {
      const basePrice = parseFloat(product.basePrice)
      const discount = parseFloat(formData.discountPercentage)

      if (!isNaN(basePrice) && !isNaN(discount) && discount > 0 && discount <= 100) {
        const newPrice = basePrice * (1 - discount / 100)
        const saved = basePrice - newPrice

        setDiscountedPrice(newPrice)
        setSavings(saved)

        // Vérifier la commission
        checkCommission(formData.productId, discount)
      } else {
        setDiscountedPrice(null)
        setSavings(null)
        setCommissionValid(null)
      }
    }
  }, [formData.discountPercentage, formData.productId, products, selectedProduct])

  const checkCommission = async (productId: string, discount: number) => {
    if (!productId || !discount) return

    setCheckingCommission(true)
    try {
      const res = await fetch('/api/promotions/validate-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, discountPercentage: discount })
      })

      const data = await res.json()
      setCommissionValid(data.valid)

      if (!data.valid) {
        toast.warning(data.message)
      }
    } catch (error) {
      console.error('Erreur lors de la validation de la commission:', error)
    } finally {
      setCheckingCommission(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.productId || !formData.discountPercentage || !formData.startDate || !formData.endDate) {
      toast.error('Tous les champs sont requis')
      return
    }

    const discount = parseFloat(formData.discountPercentage)
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      toast.error('Le pourcentage de réduction doit être entre 1 et 100')
      return
    }

    // Validation des dates
    const validation = validatePromotionData({
      discountPercentage: discount,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate)
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
      endDate: formData.endDate
    })
  }

  const selectedProductData = selectedProduct || products.find((p) => p.id === formData.productId)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Sélection du produit */}
      {!selectedProduct && products.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="product" className="text-sm sm:text-base">
            Produit <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.productId}
            onValueChange={(value) => setFormData({ ...formData, productId: value })}
          >
            <SelectTrigger id="product" className="w-full">
              <SelectValue placeholder="Sélectionner un produit" />
            </SelectTrigger>
            <SelectContent className='max-w-[calc(100vw-2rem)] sm:max-w-lg'>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id} className='max-w-full'>
                  <div className='flex items-baseline gap-2 truncate'>
                    <span className='font-medium truncate flex-1'>{product.name}</span>
                    <span className='text-sm text-gray-600 whitespace-nowrap'>{product.basePrice}€</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedProductData && (
        <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs sm:text-sm text-blue-700 font-medium mb-1">
            Produit sélectionné
          </div>
          <div className="font-semibold text-sm sm:text-base text-blue-900">
            {selectedProductData.name}
          </div>
          <div className="text-xs sm:text-sm text-blue-700">
            Prix de base : {selectedProductData.basePrice}€ / nuit
          </div>
        </div>
      )}

      {/* Pourcentage de réduction */}
      <div className="space-y-2">
        <Label htmlFor="discount" className="text-sm sm:text-base">
          Pourcentage de réduction <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="discount"
            type="number"
            min="1"
            max="100"
            step="1"
            value={formData.discountPercentage}
            onChange={(e) =>
              setFormData({ ...formData, discountPercentage: e.target.value })
            }
            placeholder="Ex: 15"
            className="pr-12"
            disabled={loading}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm sm:text-base">
            %
          </span>
        </div>
        {discountedPrice !== null && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <div className="text-xs text-green-700">Nouveau prix</div>
                <div className="font-bold text-lg sm:text-xl text-green-800">
                  {discountedPrice.toFixed(2)}€
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-green-700">Économie</div>
                <div className="font-semibold text-base sm:text-lg text-green-700">
                  -{savings?.toFixed(2)}€
                </div>
              </div>
            </div>
            {commissionValid === false && (
              <div className="mt-2 text-xs text-red-600 font-medium">
                ⚠️ Réduction trop importante pour la plateforme
              </div>
            )}
            {checkingCommission && (
              <div className="mt-2 text-xs text-gray-600">
                Vérification de la commission...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-sm sm:text-base">
            Date de début <span className="text-red-500">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-sm sm:text-base">
            Date de fin <span className="text-red-500">*</span>
          </Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            min={formData.startDate || new Date().toISOString().split('T')[0]}
            disabled={loading}
          />
        </div>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full sm:w-auto"
        disabled={loading || commissionValid === false || !formData.productId}
      >
        {loading ? 'Création en cours...' : 'Créer la promotion'}
      </Button>
    </form>
  )
}
