'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  Soup,
  Plus,
  ArrowLeft,
  CheckCircle,
  Edit3,
  Trash2,
} from 'lucide-react'
import { SecurityInterface } from '@/lib/interface/securityInterface'
import { MealsInterface } from '@/lib/interface/mealsInterface'
import { findAllMeals, createMeal, updateMeal, deleteMeal } from '@/lib/services/meals.service'

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

export default function MealsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [meals, setMeals] = useState<MealsInterface[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newOptionName, setNewOptionName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour l'édition
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<MealsInterface | null>(null)
  const [editOptionName, setEditOptionName] = useState('')

  // États pour la suppression
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingOption, setDeletingOption] = useState<MealsInterface | null>(null)

  useEffect(() => {
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const mealsData = await findAllMeals()
        if (mealsData) {
          setMeals(mealsData)
        }
      } catch (err) {
        setError('Erreur lors du chargement des options de repas')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchMeals()
  }, [])

  const filteredMeals = meals.filter((option: SecurityInterface) =>
    option.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddOption = async () => {
    if (!newOptionName.trim()) return

    setIsSubmitting(true)
    try {
      const newOption = await createMeal(newOptionName)

      if (newOption) {
        setMeals([...meals, newOption])
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

  const handleEditOption = (option: MealsInterface) => {
    setEditingOption(option)
    setEditOptionName(option.name || '')
    setIsEditDialogOpen(true)
  }

  const handleUpdateOption = async () => {
    if (!editingOption || !editOptionName.trim()) return

    setIsSubmitting(true)
    try {
      const updatedOption = await updateMeal(editingOption.id, editOptionName)

      if (updatedOption) {
        setMeals(meals.map(opt => (opt.id === editingOption.id ? updatedOption : opt)))
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

  const handleDeleteOption = (option: MealsInterface) => {
    setDeletingOption(option)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingOption) return

    setIsSubmitting(true)
    try {
      const success = await deleteMeal(deletingOption.id)

      if (success) {
        setMeals(meals.filter(opt => opt.id !== deletingOption.id))
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

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center'>
        <div className='flex items-center gap-3'>
          <Loader2 className='h-6 w-6 animate-spin text-orange-600' />
          <p className='text-slate-600 text-lg'>Chargement des options de repas...</p>
        </div>
      </div>
    )
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
                <Soup className='h-8 w-8 text-orange-600' />
                <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-orange-700 to-red-700'>
                  Gestion des options de repas
                </h1>
              </div>
              <p className='text-slate-600 text-lg'>
                {meals.length} option{meals.length > 1 ? 's' : ''} enregistrée
                {meals.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className='flex items-center gap-3'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4' />
                <Input
                  type='text'
                  placeholder='Rechercher une option...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10 w-full sm:w-64'
                />
              </div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className='bg-orange-600 hover:bg-orange-700 text-white shadow-lg'>
                    <Plus className='h-4 w-4 mr-2' />
                    Ajouter une option
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-md'>
                  <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                      <Soup className='h-5 w-5 text-orange-600' />
                      Nouvelle option de repas
                    </DialogTitle>
                    <DialogDescription>
                      Ajoutez une nouvelle option de repas à la liste disponible.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='optionName'>Nom de l&apos;option</Label>
                      <Input
                        id='optionName'
                        placeholder='Ex: Petit déjeuner, Déjeuner, Dîner...'
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
                      className='bg-orange-600 hover:bg-orange-700'
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
                      <Edit3 className='h-5 w-5 text-orange-600' />
                      Modifier l&apos;option de repas
                    </DialogTitle>
                    <DialogDescription>Modifiez le nom de cette option de repas.</DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='editOptionName'>Nom de l&apos;option</Label>
                      <Input
                        id='editOptionName'
                        placeholder='Ex: Petit déjeuner, Dîner...'
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
                      className='bg-orange-600 hover:bg-orange-700'
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
                      Supprimer l&apos;option de repas
                    </DialogTitle>
                    <DialogDescription>
                      Êtes-vous sûr de vouloir supprimer l&apos;option &quot;{deletingOption?.name}
                      &quot; ? Cette action est irréversible.
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
          {filteredMeals.length === 0 ? (
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardContent className='text-center py-12'>
                <Soup className='h-16 w-16 text-slate-300 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-slate-600 mb-2'>
                  {searchTerm ? 'Aucun résultat' : 'Aucune option de repas'}
                </h3>
                <p className='text-slate-500 mb-6'>
                  {searchTerm
                    ? 'Aucune option ne correspond à votre recherche.'
                    : 'Commencez par ajouter votre première option de repas.'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className='bg-orange-600 hover:bg-orange-700'
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Ajouter une option
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch'>
              {filteredMeals.map((option, index) => (
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
                          <div className='p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors'>
                            <Soup className='h-5 w-5 text-orange-600' />
                          </div>
                          <div>
                            <CardTitle className='text-lg font-semibold text-slate-800'>
                              {option.name || 'Option sans nom'}
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
                          className='flex-1 hover:bg-orange-50 hover:text-orange-600'
                        >
                          <Link href={`/admin/meals/${option.id}`}>
                            <Eye className='h-4 w-4 mr-2' />
                            Voir détails
                          </Link>
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='hover:bg-orange-50 hover:text-orange-600'
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
