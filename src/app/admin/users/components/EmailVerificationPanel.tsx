'use client'

import { useState } from 'react'
import { User } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcnui/dialog'
import { Button } from '@/components/ui/shadcnui/button'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Mail, Loader2, CheckCircle, XCircle, Users, User as UserIcon } from 'lucide-react'

interface EmailVerificationPanelProps {
  users: User[]
  refreshUsers: () => void
}

interface SendResult {
  userId: string
  email: string
  success: boolean
  error?: string
}

export function EmailVerificationPanel({ users, refreshUsers }: EmailVerificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'all' | 'selected' | 'single'>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [singleUser, setSingleUser] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SendResult[]>([])
  const [summary, setSummary] = useState<{
    total: number
    success: number
    failures: number
  } | null>(null)

  // Filtrer les utilisateurs non vérifiés
  const unverifiedUsers = users.filter(user => !user.emailVerified)

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(unverifiedUsers.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSendEmails = async () => {
    setIsLoading(true)
    setResults([])
    setSummary(null)

    try {
      let userIds: string[] = []

      if (mode === 'all') {
        userIds = unverifiedUsers.map(user => user.id)
      } else if (mode === 'selected') {
        userIds = selectedUsers
      } else if (mode === 'single') {
        userIds = [singleUser]
      }

      if (userIds.length === 0) {
        console.error('Aucun utilisateur sélectionné')
        return
      }

      const response = await fetch('/api/admin/users/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          mode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data.results || [])
        setSummary(data.summary || null)

        // Afficher un toast de succès
        const successCount = data.summary?.success || 0
        const failureCount = data.summary?.failures || 0

        if (successCount > 0) {
          console.log(`${successCount} email(s) envoyé(s) avec succès`)
        }
        if (failureCount > 0) {
          console.warn(`${failureCount} échec(s) lors de l'envoi`)
        }

        // Rafraîchir la liste des utilisateurs après envoi
        setTimeout(() => {
          refreshUsers()
        }, 1000)
      } else {
        console.error('Erreur:', data.error)
        // Afficher un toast d'erreur
        console.error("Erreur lors de l'envoi des emails")
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi des emails:", error)
      // Afficher un toast d'erreur
      console.error("Erreur de connexion lors de l'envoi des emails")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setMode('all')
    setSelectedUsers([])
    setSingleUser('')
    setResults([])
    setSummary(null)
  }

  const handleClose = () => {
    setIsOpen(false)
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='gap-2' disabled={unverifiedUsers.length === 0}>
          <Mail className='h-4 w-4' />
          Renvoyer emails de vérification
          {unverifiedUsers.length > 0 && (
            <span className='ml-1 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full'>
              {unverifiedUsers.length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Renvoyer les emails de vérification</DialogTitle>
          <DialogDescription>
            Choisissez les utilisateurs à qui renvoyer l&apos;email de vérification de compte. Seuls
            les comptes non vérifiés sont concernés ({unverifiedUsers.length} comptes).
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Mode de sélection */}
          <div>
            <label className='text-sm font-medium'>Mode d&apos;envoi</label>
            <Select
              value={mode}
              onValueChange={(value: 'all' | 'selected' | 'single') => setMode(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4' />
                    Tous les comptes non vérifiés ({unverifiedUsers.length})
                  </div>
                </SelectItem>
                <SelectItem value='selected'>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4' />
                    Comptes sélectionnés
                  </div>
                </SelectItem>
                <SelectItem value='single'>
                  <div className='flex items-center gap-2'>
                    <UserIcon className='h-4 w-4' />
                    Un seul compte
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sélection multiple */}
          {mode === 'selected' && (
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Checkbox
                  checked={selectedUsers.length === unverifiedUsers.length}
                  onCheckedChange={handleSelectAll}
                />
                <label className='text-sm'>Sélectionner tout</label>
              </div>

              <div className='max-h-48 overflow-y-auto border rounded p-3 space-y-2'>
                {unverifiedUsers.map(user => (
                  <div key={user.id} className='flex items-center gap-2'>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked: boolean) => handleUserSelection(user.id, checked)}
                    />
                    <div className='flex-1'>
                      <div className='text-sm font-medium'>
                        {user.name} {user.lastname}
                      </div>
                      <div className='text-xs text-gray-500'>{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedUsers.length > 0 && (
                <div className='text-sm text-blue-600'>
                  {selectedUsers.length} compte(s) sélectionné(s)
                </div>
              )}
            </div>
          )}

          {/* Sélection unique */}
          {mode === 'single' && (
            <div>
              <label className='text-sm font-medium'>Utilisateur</label>
              <Select value={singleUser} onValueChange={setSingleUser}>
                <SelectTrigger>
                  <SelectValue placeholder='Choisir un utilisateur' />
                </SelectTrigger>
                <SelectContent>
                  {unverifiedUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div>
                        <div className='font-medium'>
                          {user.name} {user.lastname}
                        </div>
                        <div className='text-xs text-gray-500'>{user.email}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Résultats */}
          {summary && (
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription>
                <div className='font-medium'>Envoi terminé</div>
                <div className='text-sm'>
                  {summary.success} emails envoyés avec succès, {summary.failures} échecs sur{' '}
                  {summary.total} total
                </div>
              </AlertDescription>
            </Alert>
          )}

          {results.length > 0 && (
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Détails des envois :</h4>
              <div className='max-h-32 overflow-y-auto space-y-1'>
                {results.map((result, index) => (
                  <div key={index} className='flex items-center gap-2 text-xs'>
                    {result.success ? (
                      <CheckCircle className='h-3 w-3 text-green-500' />
                    ) : (
                      <XCircle className='h-3 w-3 text-red-500' />
                    )}
                    <span className='flex-1'>{result.email}</span>
                    {!result.success && <span className='text-red-500'>{result.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose}>
            Fermer
          </Button>
          <Button
            onClick={handleSendEmails}
            disabled={
              isLoading ||
              (mode === 'selected' && selectedUsers.length === 0) ||
              (mode === 'single' && !singleUser)
            }
          >
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin mr-2' />
            ) : (
              <Mail className='h-4 w-4 mr-2' />
            )}
            {isLoading ? 'Envoi en cours...' : 'Envoyer les emails'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
