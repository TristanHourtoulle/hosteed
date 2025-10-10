'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { isFullAdmin } from '@/hooks/useAdminAuth'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/shadcnui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Percent, DollarSign, Save, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface CommissionSettings {
  id: string
  hostCommissionRate: number
  hostCommissionFixed: number
  clientCommissionRate: number
  clientCommissionFixed: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function CommissionSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<CommissionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    hostCommissionRate: 0,
    hostCommissionFixed: 0,
    clientCommissionRate: 0,
    clientCommissionFixed: 0,
  })

  // Security check - Only ADMIN can access commission settings
  useEffect(() => {
    if (!session?.user?.roles || !isFullAdmin(session.user.roles)) {
      router.push('/')
    }
  }, [session, router])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/commission-settings', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setFormData({
          hostCommissionRate: data.hostCommissionRate,
          hostCommissionFixed: data.hostCommissionFixed,
          clientCommissionRate: data.clientCommissionRate,
          clientCommissionFixed: data.clientCommissionFixed,
        })
      } else {
        toast.error('Erreur lors du chargement des paramètres')
      }
    } catch {
      toast.error('Erreur lors du chargement des paramètres')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (
      formData.hostCommissionRate < 0 || formData.hostCommissionRate > 1 ||
      formData.clientCommissionRate < 0 || formData.clientCommissionRate > 1 ||
      formData.hostCommissionFixed < 0 ||
      formData.clientCommissionFixed < 0
    ) {
      toast.error('Les taux doivent être entre 0 et 100% et les frais fixes positifs')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/commission-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Paramètres de commission mis à jour avec succès')
        fetchSettings()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Une erreur est survenue')
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
  }

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)}€`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres de Commission</h1>
          <p className="text-gray-600 mt-2">
            Configurez les taux de commission pour les hébergeurs et les clients
          </p>
        </div>
      </div>

      {settings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Commission Hébergeur</CardTitle>
              <Settings className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Taux (%)</span>
                  <Badge variant="secondary">{formatPercentage(settings.hostCommissionRate)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Frais fixe</span>
                  <Badge variant="secondary">{formatCurrency(settings.hostCommissionFixed)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Commission Client</CardTitle>
              <Settings className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Taux (%)</span>
                  <Badge variant="secondary">{formatPercentage(settings.clientCommissionRate)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Frais fixe</span>
                  <Badge variant="secondary">{formatCurrency(settings.clientCommissionFixed)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Modifier les paramètres de commission</CardTitle>
          <CardDescription>
            Ajustez les taux de commission et les frais fixes pour les hébergeurs et les clients.
            Les taux sont exprimés en pourcentage (0.1 = 10%).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Commission Hébergeur */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Commission Hébergeur</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hostCommissionRate" className="flex items-center space-x-2">
                    <Percent className="w-4 h-4" />
                    <span>Taux de commission (%)</span>
                  </Label>
                  <Input
                    id="hostCommissionRate"
                    type="number"
                    min="0"
                    max="1"
                    step="0.001"
                    value={formData.hostCommissionRate}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      hostCommissionRate: parseFloat(e.target.value) || 0 
                    })}
                    placeholder="Ex: 0.05 pour 5%"
                  />
                  <p className="text-xs text-gray-500">
                    Actuel: {formatPercentage(formData.hostCommissionRate)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hostCommissionFixed" className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Frais fixe (€)</span>
                  </Label>
                  <Input
                    id="hostCommissionFixed"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hostCommissionFixed}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      hostCommissionFixed: parseFloat(e.target.value) || 0 
                    })}
                    placeholder="Ex: 2.50"
                  />
                  <p className="text-xs text-gray-500">
                    Actuel: {formatCurrency(formData.hostCommissionFixed)}
                  </p>
                </div>
              </div>

              {/* Commission Client */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Settings className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Commission Client</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientCommissionRate" className="flex items-center space-x-2">
                    <Percent className="w-4 h-4" />
                    <span>Taux de commission (%)</span>
                  </Label>
                  <Input
                    id="clientCommissionRate"
                    type="number"
                    min="0"
                    max="1"
                    step="0.001"
                    value={formData.clientCommissionRate}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      clientCommissionRate: parseFloat(e.target.value) || 0 
                    })}
                    placeholder="Ex: 0.03 pour 3%"
                  />
                  <p className="text-xs text-gray-500">
                    Actuel: {formatPercentage(formData.clientCommissionRate)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientCommissionFixed" className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Frais fixe (€)</span>
                  </Label>
                  <Input
                    id="clientCommissionFixed"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.clientCommissionFixed}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      clientCommissionFixed: parseFloat(e.target.value) || 0 
                    })}
                    placeholder="Ex: 1.50"
                  />
                  <p className="text-xs text-gray-500">
                    Actuel: {formatCurrency(formData.clientCommissionFixed)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}