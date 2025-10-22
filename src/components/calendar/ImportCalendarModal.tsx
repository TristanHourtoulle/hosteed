'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcnui/dialog'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { Label } from '@/components/ui/shadcnui/label'
import { Badge } from '@/components/ui/shadcnui/badge'
import {
  Download,
  Plus,
  Trash2,
  RefreshCw,
  Calendar,
  Link2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcnui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/shadcnui/alert-dialog'

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
}

interface ImportCalendarModalProps {
  productId: string
  productName: string
}

export default function ImportCalendarModal({ productId, productName }: ImportCalendarModalProps) {
  const [open, setOpen] = useState(false)
  const [calendars, setCalendars] = useState<ExternalCalendar[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCalendarName, setNewCalendarName] = useState('')
  const [newCalendarUrl, setNewCalendarUrl] = useState('')
  const [newCalendarColor, setNewCalendarColor] = useState('#3B82F6')
  const [newCalendarDescription, setNewCalendarDescription] = useState('')

  const loadCalendars = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/calendar/${productId}/external`)

      if (!response.ok) {
        throw new Error('Failed to load calendars')
      }

      const data = await response.json()
      setCalendars(data)
    } catch (error) {
      console.error('Error loading calendars:', error)
      toast.error('Erreur lors du chargement des calendriers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCalendar = async () => {
    if (!newCalendarName.trim() || !newCalendarUrl.trim()) {
      toast.error("Le nom et l'URL sont requis")
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/calendar/${productId}/external`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCalendarName,
          icalUrl: newCalendarUrl,
          color: newCalendarColor,
          description: newCalendarDescription,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add calendar')
      }

      const newCalendar = await response.json()
      setCalendars([...calendars, newCalendar])
      setShowAddForm(false)
      setNewCalendarName('')
      setNewCalendarUrl('')
      setNewCalendarColor('#3B82F6')
      setNewCalendarDescription('')
      toast.success('Calendrier ajouté avec succès')

      // Trigger sync immediately after adding
      handleSyncCalendar(newCalendar.id)
    } catch (error) {
      console.error('Error adding calendar:', error)
      toast.error("Erreur lors de l'ajout du calendrier")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCalendar = async (calendarId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/calendar/${productId}/external/${calendarId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete calendar')
      }

      setCalendars(calendars.filter(cal => cal.id !== calendarId))
      toast.success('Calendrier supprimé avec succès')
    } catch (error) {
      console.error('Error deleting calendar:', error)
      toast.error('Erreur lors de la suppression du calendrier')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncCalendar = async (calendarId: string) => {
    try {
      setSyncing(calendarId)
      const response = await fetch(`/api/calendar/${productId}/external/${calendarId}/sync`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to sync calendar')
      }

      const result = await response.json()
      toast.success(`Synchronisé: ${result.blocksCreated} périodes bloquées`)

      // Reload calendars to get updated sync status
      await loadCalendars()
    } catch (error) {
      console.error('Error syncing calendar:', error)
      toast.error('Erreur lors de la synchronisation')
    } finally {
      setSyncing(null)
    }
  }

  const handleSyncAll = async () => {
    try {
      setSyncing('all')
      const response = await fetch(`/api/calendar/${productId}/sync-all`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to sync all calendars')
      }

      const result = await response.json()
      toast.success(`${result.successful}/${result.total} calendriers synchronisés`)

      // Reload calendars to get updated sync status
      await loadCalendars()
    } catch (error) {
      console.error('Error syncing all calendars:', error)
      toast.error('Erreur lors de la synchronisation')
    } finally {
      setSyncing(null)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleString('fr-FR')
  }

  const getSyncStatusBadge = (calendar: ExternalCalendar) => {
    if (!calendar.lastSyncStatus || calendar.lastSyncStatus === 'pending') {
      return (
        <Badge variant='secondary' className='gap-1'>
          <Clock className='h-3 w-3' />
          En attente
        </Badge>
      )
    }

    if (calendar.lastSyncStatus === 'success') {
      return (
        <Badge variant='default' className='gap-1 bg-green-600'>
          <CheckCircle className='h-3 w-3' />
          Synchronisé
        </Badge>
      )
    }

    return (
      <Badge variant='destructive' className='gap-1'>
        <XCircle className='h-3 w-3' />
        Erreur
      </Badge>
    )
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      loadCalendars()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline' className='gap-2'>
          <Download className='h-4 w-4' />
          Importer des calendriers
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5 text-blue-600' />
            Importer des calendriers externes - {productName}
          </DialogTitle>
          <DialogDescription>
            Synchronisez les dates bloquées depuis Airbnb, Booking.com, ou tout calendrier iCal
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Actions */}
          <div className='flex justify-between items-center'>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={loading}
              className='gap-2'
            >
              <Plus className='h-4 w-4' />
              Ajouter un calendrier
            </Button>

            {calendars.length > 0 && (
              <Button
                variant='outline'
                onClick={handleSyncAll}
                disabled={syncing !== null || loading}
                className='gap-2'
              >
                <RefreshCw className={`h-4 w-4 ${syncing === 'all' ? 'animate-spin' : ''}`} />
                Tout synchroniser
              </Button>
            )}
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className='border rounded-lg p-4 space-y-4 bg-slate-50'>
              <h4 className='font-semibold flex items-center gap-2'>
                <Plus className='h-4 w-4' />
                Nouveau calendrier externe
              </h4>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='calendar-name'>Nom du calendrier *</Label>
                  <Input
                    id='calendar-name'
                    placeholder='Ex: Calendrier Airbnb'
                    value={newCalendarName}
                    onChange={e => setNewCalendarName(e.target.value)}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='calendar-color'>Couleur</Label>
                  <div className='flex gap-2'>
                    <Input
                      id='calendar-color'
                      type='color'
                      value={newCalendarColor}
                      onChange={e => setNewCalendarColor(e.target.value)}
                      className='w-20 h-10'
                    />
                    <Input value={newCalendarColor} readOnly className='font-mono text-sm' />
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='calendar-url'>URL du flux iCal *</Label>
                <Input
                  id='calendar-url'
                  placeholder='https://...'
                  value={newCalendarUrl}
                  onChange={e => setNewCalendarUrl(e.target.value)}
                  className='font-mono text-sm'
                />
                <p className='text-xs text-muted-foreground'>
                  L&apos;URL .ics fournie par Airbnb, Booking.com, Google Calendar, etc.
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='calendar-description'>Description (optionnel)</Label>
                <Input
                  id='calendar-description'
                  placeholder='Notes ou informations supplémentaires'
                  value={newCalendarDescription}
                  onChange={e => setNewCalendarDescription(e.target.value)}
                />
              </div>

              <div className='flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setShowAddForm(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddCalendar} disabled={loading}>
                  {loading ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </div>
          )}

          {/* Calendars List */}
          {loading && calendars.length === 0 ? (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-muted-foreground'>Chargement...</p>
            </div>
          ) : calendars.length === 0 ? (
            <div className='text-center py-8 border rounded-lg bg-slate-50'>
              <Link2 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='font-semibold text-lg mb-2'>Aucun calendrier importé</h3>
              <p className='text-muted-foreground mb-4'>
                Commencez par ajouter un calendrier externe à synchroniser
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Dernière sync</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calendars.map(calendar => (
                  <TableRow key={calendar.id}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <div
                          className='w-3 h-3 rounded-full'
                          style={{ backgroundColor: calendar.color }}
                        />
                        <div>
                          <div className='font-medium'>{calendar.name}</div>
                          {calendar.description && (
                            <div className='text-xs text-muted-foreground'>
                              {calendar.description}
                            </div>
                          )}
                          {calendar.lastSyncError && (
                            <div className='text-xs text-red-600 flex items-center gap-1 mt-1'>
                              <AlertTriangle className='h-3 w-3' />
                              {calendar.lastSyncError}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getSyncStatusBadge(calendar)}</TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {formatDate(calendar.lastSyncAt)}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleSyncCalendar(calendar.id)}
                          disabled={syncing === calendar.id || loading}
                          className='gap-1'
                        >
                          <RefreshCw
                            className={`h-3 w-3 ${syncing === calendar.id ? 'animate-spin' : ''}`}
                          />
                          Sync
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant='destructive' size='sm' className='gap-1'>
                              <Trash2 className='h-3 w-3' />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le calendrier &quot;
                                {calendar.name}&quot; ? Les périodes bloquées importées depuis ce
                                calendrier seront également supprimées.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCalendar(calendar.id)}
                                className='bg-red-600 hover:bg-red-700'
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Info */}
          <div className='text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <p className='font-semibold mb-2'>Synchronisation automatique :</p>
            <ul className='space-y-1 list-disc list-inside'>
              <li>Les calendriers sont synchronisés automatiquement toutes les 24 heures</li>
              <li>Utilisez le bouton &quot;Sync&quot; pour forcer une synchronisation manuelle</li>
              <li>Les dates bloquées sont automatiquement ajoutées à votre calendrier</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
