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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/shadcnui/avatar'
import {
  Mail,
  Loader2,
  CheckCircle2,
  XCircle,
  Users as UsersIcon,
  User as UserIcon,
  MailX,
  MailCheck,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { getUserAvatarUrl } from '@/lib/utils/userAvatar'

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

type SendMode = 'all' | 'selected' | 'single'

export function EmailVerificationPanel({ users, refreshUsers }: EmailVerificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<SendMode>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [singleUser, setSingleUser] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SendResult[]>([])
  const [summary, setSummary] = useState<{
    total: number
    success: number
    failures: number
  } | null>(null)

  const unverifiedUsers = users.filter(u => !u.emailVerified)

  const toggleUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev =>
      checked ? [...prev, userId] : prev.filter(id => id !== userId)
    )
  }

  const toggleAll = (checked: boolean) => {
    setSelectedUsers(checked ? unverifiedUsers.map(u => u.id) : [])
  }

  const handleSend = async () => {
    setIsLoading(true)
    setResults([])
    setSummary(null)

    try {
      let userIds: string[] = []
      if (mode === 'all') userIds = unverifiedUsers.map(u => u.id)
      else if (mode === 'selected') userIds = selectedUsers
      else if (mode === 'single' && singleUser) userIds = [singleUser]

      if (userIds.length === 0) {
        toast.error('Aucun utilisateur sélectionné')
        return
      }

      const response = await fetch('/api/admin/users/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, mode }),
      })

      const data = await response.json()
      if (response.ok) {
        setResults(data.results || [])
        setSummary(data.summary || null)
        const successCount = data.summary?.success || 0
        if (successCount > 0) {
          toast.success(`${successCount} email${successCount > 1 ? 's' : ''} envoyé${successCount > 1 ? 's' : ''}`)
        }
        setTimeout(() => refreshUsers(), 1000)
      } else {
        toast.error(data.error || "Erreur lors de l'envoi des emails")
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error)
      toast.error('Erreur technique lors de l’envoi')
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

  const canSubmit =
    !isLoading &&
    ((mode === 'all' && unverifiedUsers.length > 0) ||
      (mode === 'selected' && selectedUsers.length > 0) ||
      (mode === 'single' && !!singleUser))

  const selectedCount =
    mode === 'all'
      ? unverifiedUsers.length
      : mode === 'selected'
        ? selectedUsers.length
        : singleUser
          ? 1
          : 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          className='gap-2 border-slate-200 bg-white/80 text-slate-700 shadow-sm hover:bg-slate-50'
          disabled={unverifiedUsers.length === 0}
        >
          <Mail className='h-4 w-4' />
          Renvoyer emails de vérification
          {unverifiedUsers.length > 0 && (
            <span className='ml-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800'>
              {unverifiedUsers.length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <div className='flex items-start gap-3'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100'>
              <Mail className='h-5 w-5' />
            </div>
            <div className='min-w-0 flex-1 space-y-1'>
              <DialogTitle className='text-lg'>Renvoyer les emails de vérification</DialogTitle>
              <DialogDescription className='text-sm text-slate-600'>
                Seuls les comptes non vérifiés sont concernés.{' '}
                <strong>{unverifiedUsers.length}</strong> compte
                {unverifiedUsers.length > 1 ? 's' : ''} en attente.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-5 py-2'>
          {/* Mode selection as icon cards */}
          <div className='grid gap-2 sm:grid-cols-3'>
            {[
              {
                value: 'all' as SendMode,
                icon: UsersIcon,
                title: 'Tous les non vérifiés',
                subtitle: `${unverifiedUsers.length} compte${unverifiedUsers.length > 1 ? 's' : ''}`,
              },
              {
                value: 'selected' as SendMode,
                icon: UsersIcon,
                title: 'Sélection',
                subtitle: 'Choix manuel',
              },
              {
                value: 'single' as SendMode,
                icon: UserIcon,
                title: 'Un utilisateur',
                subtitle: 'Compte unique',
              },
            ].map(opt => {
              const Icon = opt.icon
              const active = mode === opt.value
              return (
                <button
                  key={opt.value}
                  type='button'
                  onClick={() => setMode(opt.value)}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
                    active
                      ? 'border-blue-300 bg-blue-50/60 ring-2 ring-blue-100'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      active ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className='h-4 w-4' />
                  </div>
                  <p className='text-sm font-semibold text-slate-900'>{opt.title}</p>
                  <p className='text-xs text-slate-500'>{opt.subtitle}</p>
                </button>
              )
            })}
          </div>

          {/* Mode: selected — checkbox list */}
          {mode === 'selected' && (
            <div className='space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3'>
              <div className='flex items-center justify-between gap-3 border-b border-slate-200 pb-3'>
                <label className='flex items-center gap-2 text-sm font-medium text-slate-700'>
                  <Checkbox
                    checked={
                      selectedUsers.length === unverifiedUsers.length &&
                      unverifiedUsers.length > 0
                    }
                    onCheckedChange={toggleAll}
                  />
                  Tout sélectionner
                </label>
                <span className='text-xs text-slate-500'>
                  {selectedUsers.length} / {unverifiedUsers.length}
                </span>
              </div>
              <div className='max-h-60 space-y-1.5 overflow-y-auto'>
                {unverifiedUsers.map(user => {
                  const isChecked = selectedUsers.includes(user.id)
                  return (
                    <label
                      key={user.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition ${
                        isChecked ? 'bg-blue-50/80' : 'hover:bg-white'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked: boolean) => toggleUser(user.id, checked)}
                      />
                      <Avatar className='h-8 w-8 shrink-0'>
                        <AvatarImage src={getUserAvatarUrl(user)} alt={user.name || user.email} />
                        <AvatarFallback className='bg-gradient-to-br from-indigo-500 to-purple-500 text-[10px] font-semibold text-white'>
                          {(user.name?.[0] || user.email[0]).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium text-slate-900'>
                          {[user.name, user.lastname].filter(Boolean).join(' ') || 'Sans nom'}
                        </p>
                        <p className='truncate text-xs text-slate-500'>{user.email}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mode: single — select */}
          {mode === 'single' && (
            <div className='space-y-2'>
              <label className='text-sm font-medium text-slate-700'>Utilisateur</label>
              <Select value={singleUser} onValueChange={setSingleUser}>
                <SelectTrigger>
                  <SelectValue placeholder='Choisir un utilisateur…' />
                </SelectTrigger>
                <SelectContent className='max-h-72'>
                  {unverifiedUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className='flex flex-col'>
                        <span className='font-medium'>
                          {[user.name, user.lastname].filter(Boolean).join(' ') || user.email}
                        </span>
                        <span className='text-xs text-slate-500'>{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Results summary */}
          {summary && (
            <div className='rounded-xl border border-slate-200 bg-white p-4'>
              <div className='mb-3 flex items-center justify-between'>
                <p className='text-sm font-semibold text-slate-900'>Résultat de l’envoi</p>
                <span className='text-xs text-slate-500'>
                  {summary.total} email{summary.total > 1 ? 's' : ''} traité
                  {summary.total > 1 ? 's' : ''}
                </span>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div className='flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 ring-1 ring-emerald-100'>
                  <MailCheck className='h-4 w-4' />
                  <span className='text-sm font-semibold tabular-nums'>{summary.success}</span>
                  <span className='text-xs'>envoyés</span>
                </div>
                <div className='flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-700 ring-1 ring-red-100'>
                  <MailX className='h-4 w-4' />
                  <span className='text-sm font-semibold tabular-nums'>{summary.failures}</span>
                  <span className='text-xs'>échecs</span>
                </div>
              </div>
            </div>
          )}

          {/* Per-email result list */}
          {results.length > 0 && (
            <div className='space-y-2'>
              <h4 className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                Détails
              </h4>
              <div className='max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2'>
                {results.map((result, index) => (
                  <div
                    key={`${result.userId}-${index}`}
                    className='flex items-center gap-2 rounded-md px-2 py-1.5 text-xs'
                  >
                    {result.success ? (
                      <CheckCircle2 className='h-3.5 w-3.5 shrink-0 text-emerald-500' />
                    ) : (
                      <XCircle className='h-3.5 w-3.5 shrink-0 text-red-500' />
                    )}
                    <span className='flex-1 truncate text-slate-700'>{result.email}</span>
                    {!result.success && result.error && (
                      <span className='truncate text-red-500'>{result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={handleClose} disabled={isLoading}>
            Fermer
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSubmit}
            className='gap-2 bg-blue-600 text-white hover:bg-blue-700'
          >
            {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
            {isLoading
              ? 'Envoi…'
              : `Envoyer ${selectedCount > 0 ? `(${selectedCount})` : ''}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
