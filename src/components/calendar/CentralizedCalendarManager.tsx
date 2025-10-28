'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, Trash2, Edit2, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import EventMappingModal from './EventMappingModal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface ExternalCalendar {
  id: string
  name: string
  icalUrl: string
  color: string
  description?: string
  isActive: boolean
  lastSyncAt?: string
  lastSyncStatus?: string
  lastSyncError?: string
  createdAt: string
  eventMappings: EventMapping[]
}

interface EventMapping {
  id: string
  eventUid: string
  eventTitle: string
  startDate: string
  endDate: string
  productIds: string[]
}

interface CalendarEvent {
  uid: string
  title: string
  startDate: string
  endDate: string
  description?: string
}

export default function CentralizedCalendarManager() {
  const [calendars, setCalendars] = useState<ExternalCalendar[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMappingModal, setShowMappingModal] = useState(false)
  const [selectedCalendar, setSelectedCalendar] = useState<ExternalCalendar | null>(null)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [editingCalendar, setEditingCalendar] = useState<ExternalCalendar | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    icalUrl: '',
    color: '#3B82F6',
    description: '',
  })

  useEffect(() => {
    fetchCalendars()
  }, [])

  const fetchCalendars = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/calendars')
      if (response.ok) {
        const data = await response.json()
        setCalendars(data)
      } else {
        toast.error('Erreur lors du chargement des calendriers')
      }
    } catch (error) {
      console.error('Error fetching calendars:', error)
      toast.error('Erreur lors du chargement des calendriers')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCalendar = async () => {
    if (!formData.name || !formData.icalUrl) {
      toast.error('Nom et URL ICS requis')
      return
    }

    try {
      const response = await fetch('/api/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Calendrier créé avec succès')
        setShowAddModal(false)
        setFormData({ name: '', icalUrl: '', color: '#3B82F6', description: '' })
        fetchCalendars()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating calendar:', error)
      toast.error('Erreur lors de la création')
    }
  }

  const handleUpdateCalendar = async () => {
    if (!editingCalendar) return

    try {
      const response = await fetch(`/api/calendars/${editingCalendar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Calendrier mis à jour')
        setEditingCalendar(null)
        setFormData({ name: '', icalUrl: '', color: '#3B82F6', description: '' })
        fetchCalendars()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating calendar:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleDeleteCalendar = async (calendarId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce calendrier et tous ses mappings?')) {
      return
    }

    try {
      const response = await fetch(`/api/calendars/${calendarId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Calendrier supprimé')
        fetchCalendars()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting calendar:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleSyncCalendar = async (calendar: ExternalCalendar) => {
    try {
      toast.info('Synchronisation en cours...')
      const response = await fetch(`/api/calendars/${calendar.id}/sync`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${data.events.length} événements synchronisés`)
        setCalendarEvents(data.events)
        setSelectedCalendar(calendar)
        setShowMappingModal(true)
        fetchCalendars()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur de synchronisation')
      }
    } catch (error) {
      console.error('Error syncing calendar:', error)
      toast.error('Erreur de synchronisation')
    }
  }

  const handleOpenMappings = async (calendar: ExternalCalendar) => {
    setSelectedCalendar(calendar)
    // Récupérer les événements via sync
    await handleSyncCalendar(calendar)
  }

  const startEdit = (calendar: ExternalCalendar) => {
    setEditingCalendar(calendar)
    setFormData({
      name: calendar.name,
      icalUrl: calendar.icalUrl,
      color: calendar.color,
      description: calendar.description || '',
    })
  }

  const getSyncStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'error':
        return <XCircle className='h-4 w-4 text-red-500' />
      case 'pending':
        return <Clock className='h-4 w-4 text-gray-400' />
      default:
        return <Clock className='h-4 w-4 text-gray-400' />
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Calendriers Externes</h2>
          <p className='text-sm text-gray-600 mt-1'>
            Importez vos calendriers Airbnb, Booking.com, Google Calendar, etc.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          Ajouter un calendrier
        </Button>
      </div>

      {/* Liste des calendriers */}
      {calendars.length === 0 ? (
        <div className='text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
          <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600 mb-4'>Aucun calendrier externe configuré</p>
          <Button onClick={() => setShowAddModal(true)}>Ajouter votre premier calendrier</Button>
        </div>
      ) : (
        <div className='grid gap-4'>
          {calendars.map(calendar => (
            <div
              key={calendar.id}
              className='bg-white rounded-lg shadow p-6 border border-gray-200'
            >
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <div
                      className='w-4 h-4 rounded-full'
                      style={{ backgroundColor: calendar.color }}
                    />
                    <h3 className='text-lg font-semibold text-gray-900'>{calendar.name}</h3>
                    {getSyncStatusIcon(calendar.lastSyncStatus)}
                  </div>
                  <p className='text-sm text-gray-600 mb-2'>{calendar.icalUrl}</p>
                  {calendar.description && (
                    <p className='text-sm text-gray-500 mb-2'>{calendar.description}</p>
                  )}
                  <div className='flex items-center gap-4 text-xs text-gray-500'>
                    {calendar.lastSyncAt && (
                      <span>
                        Dernière sync:{' '}
                        {new Date(calendar.lastSyncAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    <span>{calendar.eventMappings.length} événements mappés</span>
                    {calendar.lastSyncError && (
                      <span className='text-red-600'>Erreur: {calendar.lastSyncError}</span>
                    )}
                  </div>
                </div>

                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleSyncCalendar(calendar)}
                    title='Synchroniser'
                  >
                    <RefreshCw className='h-4 w-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleOpenMappings(calendar)}
                    title='Gérer les mappings'
                  >
                    <Calendar className='h-4 w-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => startEdit(calendar)}
                    title='Modifier'
                  >
                    <Edit2 className='h-4 w-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleDeleteCalendar(calendar.id)}
                    className='text-red-600 hover:text-red-700'
                    title='Supprimer'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajout/Édition */}
      <Dialog
        open={showAddModal || !!editingCalendar}
        onOpenChange={open => {
          if (!open) {
            setShowAddModal(false)
            setEditingCalendar(null)
            setFormData({ name: '', icalUrl: '', color: '#3B82F6', description: '' })
          }
        }}
      >
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {editingCalendar ? 'Modifier le calendrier' : 'Ajouter un calendrier'}
            </DialogTitle>
            <DialogDescription>
              Configurez votre calendrier externe en renseignant les informations ci-dessous.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Nom</Label>
              <Input
                id='name'
                type='text'
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder='ex: Calendrier Airbnb'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='icalUrl'>URL ICS</Label>
              <Input
                id='icalUrl'
                type='url'
                value={formData.icalUrl}
                onChange={e => setFormData({ ...formData, icalUrl: e.target.value })}
                placeholder='https://calendar.google.com/calendar/ical/...'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='color'>Couleur</Label>
              <input
                id='color'
                type='color'
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                className='w-20 h-10 border border-gray-300 rounded-md cursor-pointer'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Description (optionnel)</Label>
              <textarea
                id='description'
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className='w-full border border-gray-300 rounded-md px-3 py-2 min-h-[80px]'
                rows={3}
                placeholder='Description du calendrier'
              />
            </div>
          </div>

          <DialogFooter className='flex gap-2'>
            <Button
              onClick={() => {
                setShowAddModal(false)
                setEditingCalendar(null)
                setFormData({ name: '', icalUrl: '', color: '#3B82F6', description: '' })
              }}
              variant='outline'
              className='flex-1'
            >
              Annuler
            </Button>
            <Button
              onClick={editingCalendar ? handleUpdateCalendar : handleCreateCalendar}
              className='flex-1'
            >
              {editingCalendar ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de mapping des événements */}
      {selectedCalendar && (
        <EventMappingModal
          isOpen={showMappingModal}
          calendar={selectedCalendar}
          events={calendarEvents}
          onClose={() => {
            setShowMappingModal(false)
            setSelectedCalendar(null)
            setCalendarEvents([])
            fetchCalendars()
          }}
        />
      )}
    </div>
  )
}
