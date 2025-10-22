'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Check, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface EventMappingModalProps {
  calendar: {
    id: string
    name: string
    color: string
    eventMappings: EventMapping[]
  }
  events: CalendarEvent[]
  onClose: () => void
}

interface CalendarEvent {
  uid: string
  title: string
  startDate: string
  endDate: string
  description?: string
}

interface EventMapping {
  eventUid: string
  productIds: string[]
}

interface Product {
  id: string
  name: string
  address: string
}

export default function EventMappingModal({ calendar, events, onClose }: EventMappingModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [mappings, setMappings] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    fetchUserProducts()
    initializeMappings()
  }, [])

  const fetchUserProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await fetch('/api/host/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        toast.error('Erreur lors du chargement des logements')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Erreur lors du chargement des logements')
    } finally {
      setLoadingProducts(false)
    }
  }

  const initializeMappings = () => {
    const initialMappings: Record<string, string[]> = {}

    // Charger les mappings existants
    calendar.eventMappings.forEach(mapping => {
      initialMappings[mapping.eventUid] = mapping.productIds
    })

    // Initialiser tous les événements avec des tableaux vides si pas de mapping
    events.forEach(event => {
      if (!initialMappings[event.uid]) {
        initialMappings[event.uid] = []
      }
    })

    setMappings(initialMappings)
  }

  const toggleProductMapping = (eventUid: string, productId: string) => {
    setMappings(prev => {
      const current = prev[eventUid] || []
      const isSelected = current.includes(productId)

      return {
        ...prev,
        [eventUid]: isSelected
          ? current.filter(id => id !== productId)
          : [...current, productId],
      }
    })
  }

  const selectAllProducts = (eventUid: string) => {
    setMappings(prev => ({
      ...prev,
      [eventUid]: products.map(p => p.id),
    }))
  }

  const deselectAllProducts = (eventUid: string) => {
    setMappings(prev => ({
      ...prev,
      [eventUid]: [],
    }))
  }

  const handleSaveAndApply = async () => {
    setSaving(true)
    try {
      // Sauvegarder tous les mappings
      const savePromises = events.map(event =>
        fetch(`/api/calendars/${calendar.id}/mappings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventUid: event.uid,
            eventTitle: event.title,
            startDate: event.startDate,
            endDate: event.endDate,
            productIds: mappings[event.uid] || [],
          }),
        })
      )

      await Promise.all(savePromises)

      // Appliquer les mappings (créer les blocs)
      const applyResponse = await fetch(`/api/calendars/${calendar.id}/apply`, {
        method: 'POST',
      })

      if (applyResponse.ok) {
        const result = await applyResponse.json()
        toast.success(
          `Mappings appliqués! ${result.blocksCreated} blocs créés pour ${result.eventsProcessed} événements`
        )
        onClose()
      } else {
        const error = await applyResponse.json()
        toast.error(error.error || 'Erreur lors de l\'application des mappings')
      }
    } catch (error) {
      console.error('Error saving mappings:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loadingProducts) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4">Chargement des logements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Mapper les événements</h3>
            <p className="text-sm text-gray-600 mt-1">
              {calendar.name} - {events.length} événements trouvés
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun événement trouvé dans ce calendrier</p>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map(event => (
                <div
                  key={event.uid}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: calendar.color }}
                        />
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatDate(event.startDate)} → {formatDate(event.endDate)}
                      </p>
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectAllProducts(event.uid)}
                      >
                        Tous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deselectAllProducts(event.uid)}
                      >
                        Aucun
                      </Button>
                    </div>
                  </div>

                  {products.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucun logement disponible</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {products.map(product => {
                        const isSelected = mappings[event.uid]?.includes(product.id)
                        return (
                          <button
                            key={product.id}
                            onClick={() => toggleProductMapping(event.uid, product.id)}
                            className={`flex items-center gap-2 p-3 rounded-md border transition-colors text-left ${
                              isSelected
                                ? 'bg-blue-50 border-blue-300'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'bg-white border-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{product.address}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {mappings[event.uid]?.length > 0 && (
                    <p className="text-xs text-blue-600 mt-2">
                      {mappings[event.uid].length} logement(s) sélectionné(s)
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1" disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSaveAndApply} className="flex-1" disabled={saving}>
            {saving ? 'Sauvegarde en cours...' : 'Sauvegarder et Appliquer'}
          </Button>
        </div>
      </div>
    </div>
  )
}
