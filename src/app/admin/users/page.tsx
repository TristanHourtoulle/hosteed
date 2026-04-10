'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User } from '@prisma/client'
import { useAuth } from '@/hooks/useAuth'
import { isFullAdmin } from '@/hooks/useAdminAuth'
import { createUser } from '@/lib/services/user.service'
import { useAdminUsersPaginated } from '@/hooks/useAdminPaginated'
import Pagination from '@/components/ui/Pagination'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/shadcnui/avatar'
import {
  Loader2,
  Calendar,
  Mail,
  Eye,
  CheckCircle2,
  Edit3,
  Users as UsersIcon,
  UserPlus,
  Shield,
  Trash2,
  ShieldCheck,
  UserCheck,
  UserCog,
  Crown,
  Home,
  PenLine,
  UserCircle2,
  MoreHorizontal,
  MailCheck,
  MailX,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
} from '@/shadcnui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcnui/dropdown-menu'
import { EmailVerificationPanel } from './components/EmailVerificationPanel'
import { ConfirmDeleteUserDialog } from './components/ConfirmDeleteUserDialog'
import { toast } from 'sonner'

import { PageHeader } from '@/components/admin/ui/PageHeader'
import { KpiCard, KpiMetric, type KpiTone } from '@/components/admin/ui/KpiCard'
import { FilterBar } from '@/components/admin/ui/FilterBar'
import { DataTable, type DataTableColumn, type DataTableSort } from '@/components/admin/ui/DataTable'
import { getUserAvatarUrl } from '@/lib/utils/userAvatar'

/**
 * Ordered list of roles known to the admin panel.
 * The order determines how they appear in the role-filter buttons and the role <Select>.
 */
const ROLES: Array<{
  value: string
  label: string
  short: string
  icon: React.ComponentType<{ className?: string }>
  tone: KpiTone
}> = [
  { value: 'ADMIN', label: 'Administrateurs', short: 'Admin', icon: Crown, tone: 'purple' },
  { value: 'HOST_MANAGER', label: 'Gestionnaires Hôtes', short: 'Gestionnaire', icon: ShieldCheck, tone: 'indigo' },
  { value: 'BLOGWRITER', label: 'Rédacteurs Blog', short: 'Rédacteur', icon: PenLine, tone: 'blue' },
  { value: 'HOST_VERIFIED', label: 'Hôtes Vérifiés', short: 'Hôte vérifié', icon: UserCheck, tone: 'emerald' },
  { value: 'HOST', label: 'Hôtes', short: 'Hôte', icon: Home, tone: 'amber' },
  { value: 'USER', label: 'Utilisateurs', short: 'Utilisateur', icon: UserCircle2, tone: 'slate' },
]

function getRoleConfig(role: string) {
  return ROLES.find(r => r.value === role)
}

function RolePill({ role }: { role: string }) {
  const config = getRoleConfig(role)
  if (!config) {
    return (
      <span className='inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200'>
        <UserCog className='h-3 w-3' />
        {role}
      </span>
    )
  }
  const Icon = config.icon
  const toneClass: Record<KpiTone, string> = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${toneClass[config.tone]}`}
    >
      <Icon className='h-3 w-3' />
      {config.short}
    </span>
  )
}

export default function UsersPage() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()

  const {
    users,
    pagination,
    loading,
    error: hookError,
    searchTerm,
    roleFilter,
    handleSearch,
    handleRoleFilter,
    goToPage,
    refetch,
  } = useAdminUsersPaginated()

  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<DataTableSort | null>({ key: 'createdAt', direction: 'desc' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Add-user dialog
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserSurname, setNewUserSurname] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')

  // Edit-role dialog
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState('')
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletionInfo, setDeletionInfo] = useState<unknown>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isFullAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  // Reset selection when page / filter changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [pagination.currentPage, searchTerm, roleFilter])

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return
    setIsSubmitting(true)
    try {
      const result = await createUser(
        {
          email: newUserEmail,
          password: newUserPassword,
          name: newUserSurname,
          lastname: newUserName,
        },
        true
      )
      if (result) {
        await refetch()
        setNewUserName('')
        setNewUserEmail('')
        setNewUserSurname('')
        setNewUserPassword('')
        setIsAddDialogOpen(false)
        toast.success('Utilisateur créé avec succès')
      } else {
        setError("Erreur lors de la création de l'utilisateur")
      }
    } catch (err) {
      console.error('Erreur lors de la création:', err)
      setError("Erreur lors de la création de l'utilisateur")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditRole = (user: User) => {
    setEditingUser(user)
    setNewRole(user.roles)
    setIsEditRoleDialogOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!editingUser || !newRole || editingUser.roles === newRole) return
    setIsUpdatingRole(true)
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (response.ok) {
        await refetch()
        setIsEditRoleDialogOpen(false)
        setEditingUser(null)
        setNewRole('')
        toast.success('Rôle mis à jour avec succès', {
          description: `Un email de notification a été envoyé à ${editingUser.name || editingUser.email}.`,
          duration: 5000,
        })
      } else {
        const errorData = await response.json()
        toast.error('Erreur lors de la modification du rôle', {
          description: errorData.error || 'Une erreur est survenue',
        })
      }
    } catch (err) {
      console.error('Erreur lors de la modification du rôle:', err)
      toast.error('Erreur lors de la modification du rôle', {
        description: 'Une erreur technique est survenue',
      })
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleDeleteClick = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`)
      if (!response.ok) {
        toast.error('Erreur lors de la récupération des informations')
        return
      }
      const info = await response.json()
      setDeletionInfo(info)
      setDeleteDialogOpen(true)
    } catch {
      toast.error('Erreur lors de la récupération des informations')
    }
  }

  const handleDeleteConfirm = async () => {
    const info = deletionInfo as { user: { id: string } } | null
    if (!info) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/users/${info.user.id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Utilisateur supprimé avec succès')
        setDeleteDialogOpen(false)
        setDeletionInfo(null)
        await refetch()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur technique lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleForceVerifyEmail = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: 'PATCH' })
      if (response.ok) {
        toast.success(`Email de ${user.name || user.email} vérifié avec succès`)
        await refetch()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erreur lors de la vérification')
      }
    } catch {
      toast.error('Erreur technique lors de la vérification')
    }
  }

  // Count users per role on the current page (display-only, not precise totals).
  const rolesCountOnPage = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const u of users) {
      acc[u.roles] = (acc[u.roles] || 0) + 1
    }
    return acc
  }, [users])

  const unverifiedCount = useMemo(
    () => users.filter(u => !u.emailVerified).length,
    [users]
  )

  const columns: DataTableColumn<User>[] = [
    {
      key: 'user',
      header: 'Utilisateur',
      sortable: true,
      sortAccessor: u => (u.name || u.email).toLowerCase(),
      render: user => (
        <div className='flex min-w-0 items-center gap-3'>
          <Avatar className='h-9 w-9 shrink-0 border-2 border-white shadow-sm'>
            <AvatarImage src={getUserAvatarUrl(user)} alt={user.name || user.email} />
            <AvatarFallback className='bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white'>
              {(user.name?.[0] || user.email[0]).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <span className='truncate text-sm font-semibold text-slate-900'>
                {user.name || user.lastname
                  ? `${user.name || ''} ${user.lastname || ''}`.trim()
                  : 'Sans nom'}
              </span>
              {user.emailVerified ? (
                <MailCheck className='h-3.5 w-3.5 shrink-0 text-emerald-500' />
              ) : (
                <MailX className='h-3.5 w-3.5 shrink-0 text-amber-500' />
              )}
            </div>
            <p className='truncate text-xs text-slate-500'>
              <Mail className='mr-1 inline h-3 w-3' />
              {user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rôle',
      sortable: true,
      sortAccessor: u => u.roles,
      render: user => <RolePill role={user.roles} />,
    },
    {
      key: 'createdAt',
      header: 'Inscrit le',
      sortable: true,
      sortAccessor: u => new Date(u.createdAt),
      render: user => (
        <div className='flex items-center gap-1.5 text-xs text-slate-500'>
          <Calendar className='h-3 w-3' />
          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
        </div>
      ),
      cellClassName: 'whitespace-nowrap',
    },
  ]

  if (isAuthLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
        <div className='mx-auto max-w-7xl space-y-8 p-6'>
          <div className='space-y-3'>
            <div className='h-4 w-40 animate-pulse rounded bg-slate-200' />
            <div className='h-10 w-80 animate-pulse rounded bg-slate-200' />
            <div className='h-4 w-96 animate-pulse rounded bg-slate-200' />
          </div>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className='h-32 animate-pulse rounded-2xl border border-slate-200/80 bg-white'
              />
            ))}
          </div>
          <div className='h-16 animate-pulse rounded-2xl border border-slate-200/80 bg-white' />
          <div className='h-96 animate-pulse rounded-2xl border border-slate-200/80 bg-white' />
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
      <motion.div
        className='mx-auto max-w-7xl space-y-8 p-6'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <PageHeader
          backHref='/admin'
          backLabel='Retour au panel admin'
          eyebrow='Espace administrateur'
          eyebrowIcon={Shield}
          title='Gestion des utilisateurs'
          subtitle='Consultez les comptes, modifiez les rôles et gérez les vérifications d’email depuis cet espace.'
          actions={
            <div className='flex items-center gap-2'>
              <EmailVerificationPanel users={users} refreshUsers={refetch} />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className='gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700'>
                    <UserPlus className='h-4 w-4' />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-md'>
                  <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                      <UserPlus className='h-5 w-5 text-blue-600' />
                      Nouvel utilisateur
                    </DialogTitle>
                    <DialogDescription>
                      Créez un compte utilisateur avec les informations ci-dessous.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='userName'>Nom</Label>
                        <Input
                          id='userName'
                          placeholder='Dupont'
                          value={newUserName}
                          onChange={e => setNewUserName(e.target.value)}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='userSurname'>Prénom</Label>
                        <Input
                          id='userSurname'
                          placeholder='Jean'
                          value={newUserSurname}
                          onChange={e => setNewUserSurname(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='userEmail'>Email</Label>
                      <Input
                        id='userEmail'
                        type='email'
                        placeholder='jean.dupont@email.com'
                        value={newUserEmail}
                        onChange={e => setNewUserEmail(e.target.value)}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='userPassword'>Mot de passe</Label>
                      <Input
                        id='userPassword'
                        type='password'
                        placeholder='••••••••'
                        value={newUserPassword}
                        onChange={e => setNewUserPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setIsAddDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAddUser}
                      disabled={
                        !newUserName.trim() ||
                        !newUserEmail.trim() ||
                        !newUserPassword.trim() ||
                        isSubmitting
                      }
                      className='gap-2 bg-blue-600 text-white hover:bg-blue-700'
                    >
                      {isSubmitting ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <CheckCircle2 className='h-4 w-4' />
                      )}
                      Créer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        {/* Error */}
        {(error || hookError) && (
          <Alert variant='destructive'>
            <AlertDescription>
              {error || hookError?.message || 'Erreur lors du chargement'}
            </AlertDescription>
          </Alert>
        )}

        {/* KPI row */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <KpiCard
            label='Utilisateurs'
            value={pagination.totalItems}
            hint='au total sur la plateforme'
            icon={UsersIcon}
            tone='blue'
            loading={loading}
          />
          <KpiCard
            label='Administrateurs'
            value={rolesCountOnPage['ADMIN'] ?? 0}
            hint='sur cette page'
            icon={Crown}
            tone='purple'
            loading={loading}
          />
          <KpiCard
            label='Hôtes'
            value={(rolesCountOnPage['HOST'] ?? 0) + (rolesCountOnPage['HOST_VERIFIED'] ?? 0)}
            hint='vérifiés et non vérifiés'
            icon={Home}
            tone='amber'
            loading={loading}
          />
          <KpiCard
            label='Non vérifiés'
            value={unverifiedCount}
            hint='emails en attente de vérification'
            icon={MailX}
            tone='red'
            loading={loading}
          />
        </div>

        {/* Role filter chips */}
        <div className='flex flex-wrap items-center gap-2'>
          <button
            onClick={() => handleRoleFilter('')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              roleFilter === ''
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            Tous
          </button>
          {ROLES.map(role => {
            const active = roleFilter === role.value
            const Icon = role.icon
            return (
              <button
                key={role.value}
                onClick={() => handleRoleFilter(active ? '' : role.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className='h-3 w-3' />
                {role.short}
              </button>
            )
          })}
        </div>

        {/* Filter bar */}
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder='Rechercher par nom, email…'
          belowSlot={
            selectedIds.size > 0 ? (
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-slate-600'>
                  {selectedIds.size} utilisateur
                  {selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSelectedIds(new Set())}
                  className='text-slate-500 hover:text-slate-900'
                >
                  Tout désélectionner
                </Button>
              </div>
            ) : null
          }
        />

        {/* Data table */}
        <DataTable<User>
          columns={columns}
          rows={users}
          getRowId={u => u.id}
          loading={loading}
          sort={sort}
          onSortChange={setSort}
          selection={{
            selectedIds,
            onSelectionChange: setSelectedIds,
          }}
          rowActions={user => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0'
                  aria-label='Actions utilisateur'
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/admin/users/${user.id}`} className='flex items-center gap-2'>
                    <Eye className='h-4 w-4' />
                    Voir le profil
                  </Link>
                </DropdownMenuItem>
                {session?.user?.id !== user.id && (
                  <DropdownMenuItem
                    onClick={() => handleEditRole(user)}
                    className='flex items-center gap-2'
                  >
                    <Edit3 className='h-4 w-4' />
                    Modifier le rôle
                  </DropdownMenuItem>
                )}
                {!user.emailVerified && (
                  <DropdownMenuItem
                    onClick={() => handleForceVerifyEmail(user)}
                    className='flex items-center gap-2'
                  >
                    <ShieldCheck className='h-4 w-4' />
                    Vérifier l’email
                  </DropdownMenuItem>
                )}
                {session?.user?.id !== user.id && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(user)}
                      className='flex items-center gap-2 text-red-600 focus:text-red-600'
                    >
                      <Trash2 className='h-4 w-4' />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          emptyState={{
            icon: UsersIcon,
            title: 'Aucun utilisateur trouvé',
            subtitle:
              searchTerm || roleFilter
                ? 'Essayez d’ajuster votre recherche ou vos filtres.'
                : 'Ajoutez votre premier utilisateur avec le bouton en haut à droite.',
          }}
        />

        {/* Footer: summary + pagination */}
        {!loading && users.length > 0 && (
          <div className='flex flex-col items-center gap-3 md:flex-row md:justify-between'>
            <p className='text-sm text-slate-500'>
              <KpiMetric
                label='utilisateurs affichés'
                value={`${(pagination.currentPage - 1) * pagination.itemsPerPage + 1}–${Math.min(
                  pagination.currentPage * pagination.itemsPerPage,
                  pagination.totalItems
                )} / ${pagination.totalItems}`}
                icon={UsersIcon}
                tone='slate'
              />
            </p>
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={goToPage}
                showPrevNext={true}
                showNumbers={true}
                maxVisiblePages={5}
              />
            )}
          </div>
        )}

        {/* Edit role dialog */}
        <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Shield className='h-5 w-5 text-blue-600' />
                Modifier le rôle
              </DialogTitle>
              <DialogDescription>
                Modifiez le rôle de{' '}
                <span className='font-semibold'>{editingUser?.name || editingUser?.email}</span>.
                Un email de notification sera envoyé.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-6 py-4'>
              <div className='flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4'>
                <Avatar className='h-10 w-10'>
                  {editingUser && <AvatarImage src={getUserAvatarUrl(editingUser)} />}
                  <AvatarFallback className='bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-semibold text-white'>
                    {(editingUser?.name?.[0] || editingUser?.email?.[0] || 'U').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-medium text-slate-900'>
                    {editingUser?.name || editingUser?.email}
                  </p>
                  <p className='truncate text-xs text-slate-500'>{editingUser?.email}</p>
                </div>
                {editingUser && <RolePill role={editingUser.roles} />}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='userRole'>Nouveau rôle</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder='Sélectionner un rôle' />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.slice()
                      .reverse()
                      .map(role => {
                        const Icon = role.icon
                        return (
                          <SelectItem key={role.value} value={role.value}>
                            <span className='inline-flex items-center gap-2'>
                              <Icon className='h-4 w-4' />
                              {role.label}
                            </span>
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setIsEditRoleDialogOpen(false)
                  setEditingUser(null)
                  setNewRole('')
                }}
                disabled={isUpdatingRole}
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateRole}
                disabled={!newRole || isUpdatingRole || editingUser?.roles === newRole}
                className='gap-2 bg-blue-600 text-white hover:bg-blue-700'
              >
                {isUpdatingRole ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <CheckCircle2 className='h-4 w-4' />
                )}
                Mettre à jour
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete dialog */}
        <ConfirmDeleteUserDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setDeletionInfo(null)
          }}
          onConfirm={handleDeleteConfirm}
          deletionInfo={deletionInfo as Parameters<typeof ConfirmDeleteUserDialog>[0]['deletionInfo']}
          isLoading={isDeleting}
        />
      </motion.div>
    </div>
  )
}
