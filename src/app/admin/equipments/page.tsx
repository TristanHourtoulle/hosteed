'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/hooks/useAdminAuth'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcnui/dialog'
import { Label } from '@/components/ui/shadcnui/label'
import { Badge } from '@/components/ui/shadcnui/badge'
import {
  Loader2,
  Search,
  Eye,
  BrushCleaning,
  Plus,
  ArrowLeft,
  CheckCircle,
  Edit3,
  Trash2,
} from 'lucide-react'

import {
  findAllEquipments,
  createEquipment,
  updateEquipment,
  deleteEquipement,
} from '@/lib/services/equipments.service'
import { EquipmentInterface } from '@/lib/interface/equipmentInterface'

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
      type: 'tween' as const,
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

export default function EquipmentsPage() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()
  const [equipments, setEquipments] = useState<EquipmentInterface[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newOptionName, setNewOptionName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour l'édition
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<EquipmentInterface | null>(null)
  const [editOptionName, setEditOptionName] = useState('')

  // États pour la suppression
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingOption, setDeletingOption] = useState<EquipmentInterface | null>(null)

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const equipmentsData = await findAllEquipments()
        if (equipmentsData) {
          setEquipments(equipmentsData)
        }
      } catch (err) {
        setError("Erreur lors du chargement des options d'équipements")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchEquipments()
  }, [])

  const filteredEquipments = equipments.filter((option: EquipmentInterface) =>
    option.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddOption = async () => {
    if (!newOptionName.trim()) return

    setIsSubmitting(true)
    try {
      // Le service createEquipment prend (name, icon) en paramètres
      const newOption = await createEquipment(newOptionName, 'default-icon')

      if (newOption) {
        setEquipments([...equipments, newOption])
        setNewOptionName('')
        setIsAddDialogOpen(false)
      } else {
        setError("Erreur lors de la création de l'option")
      }
    } catch (err) {
      console.error('Erreur lors de la création:', err)
      setError("Erreur lors de la création de l'option")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditOption = (option: EquipmentInterface) => {
    setEditingOption(option)
    setEditOptionName(option.name || '')
    setIsEditDialogOpen(true)
  }

  const handleUpdateOption = async () => {
    if (!editingOption || !editOptionName.trim()) return

    setIsSubmitting(true)
    try {
      // updateEquipment prend (id, name, icon)
      const updatedOption = await updateEquipment(
        editingOption.id,
        editOptionName,
        editingOption.icon || 'default-icon'
      )

      if (updatedOption) {
        setEquipments(equipments.map(opt => (opt.id === editingOption.id ? updatedOption : opt)))
        setEditOptionName('')
        setEditingOption(null)
        setIsEditDialogOpen(false)
      } else {
        setError("Erreur lors de la modification de l'option")
      }
    } catch (err) {
      console.error('Erreur lors de la modification:', err)
      setError("Erreur lors de la modification de l'option")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteOption = (option: EquipmentInterface) => {
    setDeletingOption(option)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingOption) return

    setIsSubmitting(true)
    try {
      const success = await deleteEquipement(deletingOption.id)

      if (success) {
        setEquipments(equipments.filter(opt => opt.id !== deletingOption.id))
        setDeletingOption(null)
        setIsDeleteDialogOpen(false)
      } else {
        setError("Erreur lors de la suppression de l'option")
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      setError("Erreur lors de la suppression de l'option")
    } finally {
      setIsSubmitting(false)
    }
  }

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

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <motion.div
        className='max-w-7xl mx-auto p-6 space-y-8'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Header with breadcrumb */}
        <motion.div variants={itemVariants} className='space-y-4'>
          <Button variant='ghost' size='sm' asChild className='text-slate-600 hover:text-slate-800'>
            <Link href='/admin' className='flex items-center gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Retour au dashboard
            </Link>
          </Button>

          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <BrushCleaning className='h-8 w-8 text-green-600' />
                <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-green-700 to-emerald-700'>
                  Gestion des options d&apos;équipements
                </h1>
              </div>
              <p className='text-slate-600 text-lg'>
                {equipments.length} option{equipments.length > 1 ? 's' : ''} enregistrée
                {equipments.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className='flex items-center gap-3'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4' />
                <Input
                  type='text'
                  placeholder='Rechercher un équipement...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10 w-full sm:w-64'
                />
              </div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className='bg-green-600 hover:bg-green-700 text-white shadow-lg'>
                    <Plus className='h-4 w-4 mr-2' />
                    Ajouter un équipement
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-md'>
                  <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                      <BrushCleaning className='h-5 w-5 text-green-600' />
                      Nouvel équipement
                    </DialogTitle>
                    <DialogDescription>
                      Ajoutez un nouvel équipement à la liste disponible.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='optionName'>Nom de l&apos;équipement</Label>
                      <Input
                        id='optionName'
                        placeholder='Ex: Lave-linge, Lave-vaisselle, Micro-ondes...'
                        value={newOptionName}
                        onChange={e => setNewOptionName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !isSubmitting && handleAddOption()}
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
                      onClick={handleAddOption}
                      disabled={!newOptionName.trim() || isSubmitting}
                      className='bg-green-600 hover:bg-green-700'
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

              {/* Dialog d'édition */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className='sm:max-w-[425px]'>
                  <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                      <Edit3 className='h-5 w-5 text-green-600' />
                      Modifier l&apos;équipement
                    </DialogTitle>
                    <DialogDescription>Modifiez le nom de cet équipement.</DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='editOptionName'>Nom de l&apos;équipement</Label>
                      <Input
                        id='editOptionName'
                        placeholder='Ex: Aspirateur, Fer à repasser...'
                        value={editOptionName}
                        onChange={e => setEditOptionName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !isSubmitting && handleUpdateOption()}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setIsEditDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleUpdateOption}
                      disabled={!editOptionName.trim() || isSubmitting}
                      className='bg-green-600 hover:bg-green-700'
                    >
                      {isSubmitting ? (
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

              {/* Dialog de suppression */}
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className='sm:max-w-[425px]'>
                  <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                      <Trash2 className='h-5 w-5 text-red-600' />
                      Supprimer l&apos;équipement
                    </DialogTitle>
                    <DialogDescription>
                      Êtes-vous sûr de vouloir supprimer l&apos;équipement &quot;
                      {deletingOption?.name}&quot; ? Cette action est irréversible.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setIsDeleteDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleConfirmDelete}
                      disabled={isSubmitting}
                      variant='destructive'
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                          Suppression...
                        </>
                      ) : (
                        <>
                          <Trash2 className='h-4 w-4 mr-2' />
                          Supprimer
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div variants={itemVariants}>
          {filteredEquipments.length === 0 ? (
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardContent className='text-center py-12'>
                <BrushCleaning className='h-16 w-16 text-slate-300 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-slate-600 mb-2'>
                  {searchTerm ? 'Aucun résultat' : 'Aucun équipement'}
                </h3>
                <p className='text-slate-500 mb-6'>
                  {searchTerm
                    ? 'Aucun équipement ne correspond à votre recherche.'
                    : 'Commencez par ajouter votre premier équipement.'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className='bg-green-600 hover:bg-green-700'
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Ajouter un équipement
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch'>
              {filteredEquipments.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group h-full'>
                    <CardHeader className='pb-3'>
                      <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors'>
                            <BrushCleaning className='h-5 w-5 text-green-600' />
                          </div>
                          <div>
                            <CardTitle className='text-lg font-semibold text-slate-800'>
                              {option.name || 'Équipement sans nom'}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge
                          variant='secondary'
                          className='bg-green-50 text-green-700 border-green-200'
                        >
                          Actif
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className='pt-0'>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          asChild
                          className='flex-1 hover:bg-green-50 hover:text-green-600'
                        >
                          <Link href={`/admin/equipments/${option.id}`}>
                            <Eye className='h-4 w-4 mr-2' />
                            Voir détails
                          </Link>
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='hover:bg-green-50 hover:text-green-600'
                          onClick={() => handleEditOption(option)}
                        >
                          <Edit3 className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='hover:bg-red-50 hover:text-red-600'
                          onClick={() => handleDeleteOption(option)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
