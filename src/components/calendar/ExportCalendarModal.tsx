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
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  CalendarDays,
  Shield,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/shadcnui/alert'

interface ExportCalendarModalProps {
  productId: string
  productName: string
}

export default function ExportCalendarModal({ productId, productName }: ExportCalendarModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedUrl, setFeedUrl] = useState('')
  const [webcalUrl, setWebcalUrl] = useState('')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedWebcal, setCopiedWebcal] = useState(false)

  const loadFeedUrl = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/calendar/${productId}/token`)

      if (!response.ok) {
        throw new Error('Failed to load calendar feed')
      }

      const data = await response.json()
      setFeedUrl(data.feedUrl)
      setWebcalUrl(data.webcalUrl)
    } catch (error) {
      console.error('Error loading feed URL:', error)
      toast.error('Erreur lors du chargement du lien calendrier')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateToken = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/calendar/${productId}/token`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate token')
      }

      const data = await response.json()
      setFeedUrl(data.feedUrl)
      setWebcalUrl(data.webcalUrl)
      toast.success('Nouveau lien généré avec succès')
    } catch (error) {
      console.error('Error regenerating token:', error)
      toast.error('Erreur lors de la génération du nouveau lien')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'url' | 'webcal') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'url') {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      } else {
        setCopiedWebcal(true)
        setTimeout(() => setCopiedWebcal(false), 2000)
      }
      toast.success('Copié dans le presse-papiers')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Erreur lors de la copie')
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && !feedUrl) {
      loadFeedUrl()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline' className='gap-2'>
          <Download className='h-4 w-4' />
          Exporter le calendrier
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <CalendarDays className='h-5 w-5 text-blue-600' />
            Exporter le calendrier - {productName}
          </DialogTitle>
          <DialogDescription>
            Synchronisez votre calendrier Hosteed avec d&apos;autres plateformes (Airbnb,
            Booking.com, Google Calendar, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Security Warning */}
          <Alert>
            <Shield className='h-4 w-4' />
            <AlertTitle>Lien sécurisé</AlertTitle>
            <AlertDescription>
              Ce lien est privé et unique à votre calendrier. Ne le partagez pas publiquement. Si
              vous pensez qu&apos;il a été compromis, régénérez-le.
            </AlertDescription>
          </Alert>

          {/* Standard URL */}
          <div className='space-y-2'>
            <Label htmlFor='feed-url'>URL du flux iCalendar (ICS)</Label>
            <div className='flex gap-2'>
              <Input
                id='feed-url'
                value={feedUrl}
                readOnly
                placeholder={loading ? 'Chargement...' : ''}
                className='font-mono text-sm'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(feedUrl, 'url')}
                disabled={!feedUrl || loading}
              >
                {copiedUrl ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Utilisez ce lien pour importer dans Airbnb, Booking.com, ou tout calendrier compatible
              iCal
            </p>
          </div>

          {/* Webcal URL */}
          <div className='space-y-2'>
            <Label htmlFor='webcal-url'>URL Webcal (pour calendriers Apple/Google)</Label>
            <div className='flex gap-2'>
              <Input
                id='webcal-url'
                value={webcalUrl}
                readOnly
                placeholder={loading ? 'Chargement...' : ''}
                className='font-mono text-sm'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(webcalUrl, 'webcal')}
                disabled={!webcalUrl || loading}
              >
                {copiedWebcal ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Cliquez sur le lien webcal pour ajouter directement à Google Calendar ou Apple
              Calendar
            </p>
          </div>

          {/* Instructions */}
          <div className='space-y-3 rounded-lg border p-4 bg-slate-50'>
            <h4 className='font-semibold text-sm flex items-center gap-2'>
              <ExternalLink className='h-4 w-4' />
              Comment l&apos;utiliser :
            </h4>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li className='flex gap-2'>
                <Badge variant='secondary' className='shrink-0'>
                  Airbnb
                </Badge>
                <span>
                  Paramètres → Calendrier → Importer un calendrier → Coller l&apos;URL ICS
                </span>
              </li>
              <li className='flex gap-2'>
                <Badge variant='secondary' className='shrink-0'>
                  Booking.com
                </Badge>
                <span>Extranet → Calendrier → Synchroniser les calendriers → Importer</span>
              </li>
              <li className='flex gap-2'>
                <Badge variant='secondary' className='shrink-0'>
                  Google
                </Badge>
                <span>Google Calendar → Autres agendas → À partir de l&apos;URL → Webcal URL</span>
              </li>
              <li className='flex gap-2'>
                <Badge variant='secondary' className='shrink-0'>
                  Apple
                </Badge>
                <span>Calendrier → Fichier → Nouvel abonnement → Webcal URL</span>
              </li>
            </ul>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Les plateformes synchronisent généralement toutes les 1-24 heures. Les modifications
              peuvent prendre du temps à apparaître.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className='flex justify-between items-center pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={handleRegenerateToken}
              disabled={loading}
              className='gap-2'
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Régénérer le lien
            </Button>

            <Button type='button' onClick={() => setOpen(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
