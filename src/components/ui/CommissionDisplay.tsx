'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Calculator, TrendingUp, TrendingDown, Info } from 'lucide-react'

// Interface pour les calculs de commission
interface CommissionCalculation {
  basePrice: number
  hostCommission: number
  clientCommission: number
  totalPrice: number
  hostReceives: number
  clientPays: number
  breakdown: {
    hostCommissionRate: number
    hostCommissionFixed: number
    clientCommissionRate: number
    clientCommissionFixed: number
  }
}

// Fonction pour formater les résultats
function formatCommissionBreakdown(calculation: CommissionCalculation) {
  return {
    basePrice: `${calculation.basePrice.toFixed(2)}€`,
    hostCommission: `${calculation.hostCommission.toFixed(2)}€`,
    clientCommission: `${calculation.clientCommission.toFixed(2)}€`,
    hostReceives: `${calculation.hostReceives.toFixed(2)}€`,
    clientPays: `${calculation.clientPays.toFixed(2)}€`,
    hostCommissionPercentage: `${(calculation.breakdown.hostCommissionRate * 100).toFixed(2)}%`,
    clientCommissionPercentage: `${(calculation.breakdown.clientCommissionRate * 100).toFixed(2)}%`,
  }
}

interface CommissionDisplayProps {
  basePrice: number
  className?: string
  showDetails?: boolean
}

export default function CommissionDisplay({
  basePrice,
  className = '',
  showDetails = true,
}: CommissionDisplayProps) {
  const [calculation, setCalculation] = useState<CommissionCalculation | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (basePrice && basePrice > 0) {
      setLoading(true)

      // Appel à l'API au lieu du service direct
      fetch('/api/commission/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ basePrice }),
      })
        .then(async response => {
          const data = await response.json()
          if (data.success) {
            setCalculation(data.data)
          } else {
            console.error('Erreur API:', data.error)
            setCalculation(null)
          }
        })
        .catch(error => {
          console.error('Erreur lors du calcul des commissions:', error)
          setCalculation(null)
        })
        .finally(() => setLoading(false))
    } else {
      setCalculation(null)
    }
  }, [basePrice])

  if (!basePrice || basePrice <= 0) {
    return (
      <Card className={`${className} opacity-50`}>
        <CardHeader className='pb-3'>
          <div className='flex items-center gap-2'>
            <Calculator className='w-4 h-4 text-gray-400' />
            <CardTitle className='text-sm text-gray-500'>Calcul des commissions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className='text-xs text-gray-400'>
            Saisissez un prix de base pour voir le calcul des commissions
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className='pb-3'>
          <div className='flex items-center gap-2'>
            <Calculator className='w-4 h-4 text-blue-600' />
            <CardTitle className='text-sm'>Calcul des commissions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-2'>
            <div className='h-4 bg-gray-200 rounded w-3/4'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!calculation) {
    return null
  }

  const formatted = formatCommissionBreakdown(calculation)

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <div className='flex items-center gap-2'>
          <Calculator className='w-4 h-4 text-blue-600' />
          <CardTitle className='text-sm'>Calcul des commissions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Prix de base */}
        <div className='flex justify-between items-center'>
          <span className='text-sm text-gray-600'>Prix de base</span>
          <Badge variant='outline'>{formatted.basePrice}</Badge>
        </div>

        {/* Commission hébergeur */}
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-1'>
            <TrendingDown className='w-3 h-3 text-red-500' />
            <span className='text-sm text-gray-600'>Commission hébergeur</span>
            {showDetails && (
              <span className='text-xs text-gray-400'>
                ({formatted.hostCommissionPercentage} +{' '}
                {calculation.breakdown.hostCommissionFixed.toFixed(2)}€)
              </span>
            )}
          </div>
          <Badge variant='secondary' className='text-red-600'>
            -{formatted.hostCommission}
          </Badge>
        </div>

        {/* Commission client */}
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-1'>
            <TrendingUp className='w-3 h-3 text-green-500' />
            <span className='text-sm text-gray-600'>Commission client</span>
            {showDetails && (
              <span className='text-xs text-gray-400'>
                ({formatted.clientCommissionPercentage} +{' '}
                {calculation.breakdown.clientCommissionFixed.toFixed(2)}€)
              </span>
            )}
          </div>
          <Badge variant='secondary' className='text-green-600'>
            +{formatted.clientCommission}
          </Badge>
        </div>

        <hr className='my-2' />

        {/* Résultats finaux */}
        <div className='space-y-2'>
          <div className='flex justify-between items-center font-medium'>
            <span className='text-sm text-green-700'>Vous recevrez</span>
            <Badge className='bg-green-100 text-green-800'>{formatted.hostReceives}</Badge>
          </div>

          <div className='flex justify-between items-center font-medium'>
            <span className='text-sm text-blue-700'>Le client paiera</span>
            <Badge className='bg-blue-100 text-blue-800'>{formatted.clientPays}</Badge>
          </div>
        </div>

        {showDetails && (
          <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center gap-1 mb-2'>
              <Info className='w-3 h-3 text-gray-500' />
              <span className='text-xs font-medium text-gray-600'>Comment ça marche ?</span>
            </div>
            <div className='text-xs text-gray-500 space-y-1'>
              <p>• Vous définissez le prix de base de votre hébergement</p>
              <p>• Une commission est prélevée sur vos revenus (côté hébergeur)</p>
              <p>• Une commission est ajoutée au prix que paie le client</p>
              <p>• Ces commissions permettent de financer la plateforme</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
