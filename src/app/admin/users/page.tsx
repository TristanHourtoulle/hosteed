'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { isFullAdmin } from '@/hooks/useAdminAuth'
import { createUser } from '@/lib/services/user.service'
import { User } from '@prisma/client'
import { useAdminUsersPaginated } from '@/hooks/useAdminPaginated'
import Pagination from '@/components/ui/Pagination'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/shadcnui/avatar'
import {
  Loader2,
  Search,
  User as UserIcon,
  Calendar,
  Mail,
  Eye,
  CheckCircle,
  Edit3,
  Users,
  Filter,
  MoreVertical,
  UserPlus,
  Shield,
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
import { RoleBadge, RoleIcon } from '@/components/ui/RoleBadge'
import { EmailVerificationPanel } from './components/EmailVerificationPanel'
import { toast } from 'sonner'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export default function UsersPage() {
  const { session, isLoading: isAuthLoading, isAuthenticated } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()

  // Use optimized pagination hook
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

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserSurname, setnewUserSurname] = useState('')
  const [newUserEmail, setnewUserEmail] = useState('')
  const [newUserPassword, setnewUserPassword] = useState('')

  // États pour la modification des rôles
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState('')
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  const handleAddOption = async () => {
    if (
      !newUserName.trim() &&
      !newUserSurname.trim() &&
      !newUserEmail.trim() &&
      !newUserPassword.trim()
    )
      return

    setIsSubmitting(true)
    try {
      const newOption = await createUser(
        {
          email: newUserEmail,
          password: newUserPassword,
          name: newUserSurname,
          lastname: newUserName,
        },
        true
      )

      if (newOption) {
        // Refresh the paginated data instead of manually updating state
        await refetch()
        setNewUserName('')
        setnewUserEmail('')
        setnewUserSurname('')
        setnewUserPassword('')
        setIsAddDialogOpen(false)
      } else {
        setError("Erreur lors de la création de l'utilisateur")
      }
    } catch (err) {
      console.error('Erreur lors de la création:', err)
      setError("Erreur lors de la création de l'utilisateurs")
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        // Refresh the paginated data instead of manually updating state
        await refetch()
        setIsEditRoleDialogOpen(false)
        setEditingUser(null)
        setNewRole('')

        // Notification toast de succès
        toast.success('Rôle mis à jour avec succès !', {
          description: `Un email de notification a été envoyé à ${editingUser.name || editingUser.email} pour l'informer du changement de rôle.`,
          duration: 5000,
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la modification du rôle')
        toast.error('Erreur lors de la modification du rôle', {
          description: errorData.error || 'Une erreur est survenue',
        })
      }
    } catch (err) {
      console.error('Erreur lors de la modification du rôle:', err)
      setError('Erreur lors de la modification du rôle')
      toast.error('Erreur lors de la modification du rôle', {
        description: 'Une erreur technique est survenue',
      })
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      ADMIN: 'Administrateur',
      BLOGWRITER: 'Rédacteur Blog',
      HOST: 'Hôte',
      HOST_VERIFIED: 'Hôte Vérifié',
      USER: 'Utilisateur',
    }
    return roleNames[role] || role
  }

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isFullAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  // Remove manual data fetching - handled by hook now

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error || hookError) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8'>
        <div className='max-w-7xl mx-auto'>
          <Alert variant='destructive' className='rounded-2xl'>
            <AlertDescription>{error || hookError?.message || 'Erreur lors du chargement'}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      <div className='container mx-auto p-6 space-y-8'>
        {/* Header Section */}
        <motion.div
          className='text-center space-y-4'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          <motion.div
            variants={itemVariants}
            className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg mb-4'
          >
            <Users className='w-8 h-8 text-white' />
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className='text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent'
          >
            Gestion des Utilisateurs
          </motion.h1>
          <motion.p variants={itemVariants} className='text-gray-600 text-lg max-w-2xl mx-auto'>
            Gérez les comptes utilisateurs, leurs rôles et permissions depuis ce panneau
            d&apos;administration
          </motion.p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'
        >
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-blue-100 text-sm font-medium'>Total Utilisateurs</p>
                    <p className='text-3xl font-bold'>{pagination.totalItems}</p>
                  </div>
                  <Users className='h-8 w-8 text-blue-200' />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {['ADMIN', 'HOST_VERIFIED', 'HOST', 'USER'].map(role => {
            const count = users.filter(user => user.roles === role).length
            return (
              <motion.div key={role} variants={itemVariants}>
                <Card 
                  className='border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm cursor-pointer'
                  onClick={() => handleRoleFilter(roleFilter === role ? '' : role)}
                >
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-gray-600 text-sm font-medium'>
                          {role === 'ADMIN'
                            ? 'Administrateurs'
                            : role === 'HOST_VERIFIED'
                              ? 'Hôtes Vérifiés'
                              : role === 'HOST'
                                ? 'Hôtes'
                                : 'Utilisateurs'}
                          {roleFilter === role && ' (Filtré)'}
                        </p>
                        <p className='text-2xl font-bold text-gray-900'>{roleFilter === role ? pagination.totalItems : count}</p>
                      </div>
                      <RoleIcon role={role} size='md' />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Search and Actions */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-0'
        >
          <motion.div variants={itemVariants} className='flex items-center gap-4 w-full sm:w-auto'>
            <div className='relative flex-1 sm:min-w-[300px]'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                type='text'
                placeholder='Rechercher par nom, email...'
                value={searchTerm}
                onChange={e => handleSearch(e.target.value)}
                className='pl-10 py-3 border-0 bg-gray-50 focus:bg-white transition-colors rounded-xl'
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className='flex gap-3'>
            <Button variant='outline' className='rounded-xl border-gray-200 hover:bg-gray-50'>
              <Filter className='h-4 w-4 mr-2' />
              Filtrer
            </Button>
            <EmailVerificationPanel users={users} refreshUsers={refetch} />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className='bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg'>
                  <UserPlus className='h-4 w-4 mr-2' />
                  Ajouter un utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-md rounded-2xl'>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2 text-xl'>
                    <UserPlus className='h-5 w-5 text-blue-600' />
                    Ajouter un utilisateur
                  </DialogTitle>
                  <DialogDescription>
                    Créez un nouveau compte utilisateur avec les informations ci-dessous.
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
                        className='rounded-xl'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='userSurname'>Prénom</Label>
                      <Input
                        id='userSurname'
                        placeholder='Jean'
                        value={newUserSurname}
                        onChange={e => setnewUserSurname(e.target.value)}
                        className='rounded-xl'
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
                      onChange={e => setnewUserEmail(e.target.value)}
                      className='rounded-xl'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='userPassword'>Mot de passe</Label>
                    <Input
                      id='userPassword'
                      type='password'
                      placeholder='••••••••'
                      value={newUserPassword}
                      onChange={e => setnewUserPassword(e.target.value)}
                      className='rounded-xl'
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                    className='rounded-xl'
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleAddOption}
                    disabled={!newUserName.trim() || isSubmitting}
                    className='bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl'
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                        Création...
                      </>
                    ) : (
                      <>
                        <CheckCircle className='h-4 w-4 mr-2' />
                        Créer
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        </motion.div>

        {/* Users Grid */}
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        >
          {users.map((user, index) => (
            <motion.div key={user.id} variants={itemVariants} transition={{ delay: index * 0.1 }}>
              <Card className='group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden'>
                <CardHeader className='pb-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-4'>
                      <Avatar className='h-12 w-12 border-2 border-white shadow-lg'>
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                        />
                        <AvatarFallback className='bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold'>
                          {(user.name?.[0] || user.email[0]).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1'>
                        <h3 className='font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors'>
                          {user.name || user.lastname
                            ? `${user.name || ''} ${user.lastname || ''}`.trim()
                            : 'Sans nom'}
                        </h3>
                        <p className='text-gray-500 text-sm flex items-center gap-1'>
                          <Mail className='h-3 w-3' />
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='rounded-xl'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className='flex items-center gap-2'
                          >
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className='pt-0'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <RoleBadge role={user.roles} size='sm' />
                      {session?.user?.id !== user.id && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEditRole(user)}
                          className='h-8 w-8 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600'
                          title='Modifier le rôle'
                        >
                          <Edit3 className='h-3 w-3' />
                        </Button>
                      )}
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-500'>
                      <Calendar className='h-4 w-4' />
                      <span>Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {users.length === 0 && !loading && (
          <motion.div variants={itemVariants} className='text-center py-12'>
            <UserIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucun utilisateur trouvé</h3>
            <p className='text-gray-500'>
              Essayez de modifier votre recherche ou ajoutez un nouvel utilisateur.
            </p>
          </motion.div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className='mt-8 flex justify-center'>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={goToPage}
              showPrevNext={true}
              showNumbers={true}
              maxVisiblePages={5}
            />
          </div>
        )}

        {/* Results summary */}
        {users.length > 0 && (
          <div className='mt-4 text-center text-sm text-gray-500'>
            Affichage de {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} à{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} sur{' '}
            {pagination.totalItems} utilisateurs
          </div>
        )}

        {/* Modal de modification des rôles */}
        <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
          <DialogContent className='sm:max-w-md rounded-2xl'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-xl'>
                <Shield className='h-5 w-5 text-blue-600' />
                Modifier le rôle utilisateur
              </DialogTitle>
              <DialogDescription>
                Modifiez le rôle de{' '}
                <span className='font-semibold'>{editingUser?.name || editingUser?.email}</span>
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-6 py-4'>
              <div className='text-center'>
                <div className='inline-flex items-center gap-3 p-4 bg-gray-50 rounded-xl'>
                  <Avatar className='h-10 w-10'>
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${editingUser?.email}`}
                    />
                    <AvatarFallback className='bg-gradient-to-r from-blue-500 to-indigo-600 text-white'>
                      {(editingUser?.name?.[0] || editingUser?.email?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='text-left'>
                    <p className='font-medium'>{editingUser?.name || editingUser?.email}</p>
                    <p className='text-sm text-gray-500'>
                      Rôle actuel: {getRoleDisplayName(editingUser?.roles || '')}
                    </p>
                  </div>
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='userRole'>Nouveau rôle</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className='rounded-xl'>
                    <SelectValue placeholder='Sélectionner un rôle' />
                  </SelectTrigger>
                  <SelectContent className='rounded-xl'>
                    <SelectItem value='USER'>👤 Utilisateur</SelectItem>
                    <SelectItem value='HOST'>🏠 Hôte</SelectItem>
                    <SelectItem value='HOST_VERIFIED'>✅ Hôte Vérifié</SelectItem>
                    <SelectItem value='BLOGWRITER'>✍️ Rédacteur Blog</SelectItem>
                    <SelectItem value='ADMIN'>👑 Administrateur</SelectItem>
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
                className='rounded-xl'
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateRole}
                disabled={!newRole || isUpdatingRole || editingUser?.roles === newRole}
                className='bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl'
              >
                {isUpdatingRole ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Modification...
                  </>
                ) : (
                  <>
                    <CheckCircle className='h-4 w-4 mr-2' />
                    Modifier
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
