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
import { Checkbox } from '@/components/ui/shadcnui/checkbox'
import {
  Loader2,
  Search,
  Eye,
  Home,
  Plus,
  ArrowLeft,
  CheckCircle,
  Edit3,
  Trash2,
  Hotel,
} from 'lucide-react'
import {
  findAllTypeRent,
  createTypeRent,
  updateTypeRent,
} from '@/lib/services/typeRent.service'
import { TypeRentInterface } from '@/lib/interface/typeRentInterface'
import DeleteTypeModal from './components/DeleteTypeModal'

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

export default function TypeRentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [typeRents, setTypeRents] = useState<TypeRentInterface[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeDescription, setNewTypeDescription] = useState('')
  const [newIsHotelType, setNewIsHotelType] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour l'édition
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<TypeRentInterface | null>(null)
  const [editTypeName, setEditTypeName] = useState('')
  const [editTypeDescription, setEditTypeDescription] = useState('')
  const [editIsHotelType, setEditIsHotelType] = useState(false)

  // États pour la suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingType, setDeletingType] = useState<TypeRentInterface | null>(null)

  useEffect(() => {
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  useEffect(() => {
    const fetchTypeRents = async () => {
      try {
        const typeRentData = await findAllTypeRent()
        if (typeRentData) {
          setTypeRents(typeRentData)
        }
      } catch (err) {
        setError('Erreur lors du chargement des types de logements')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTypeRents()
  }, [])

  const filteredTypes = typeRents.filter(
    type =>
      type.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddType = async () => {
    if (!newTypeName.trim() || !newTypeDescription.trim()) return

    setIsSubmitting(true)
    try {
      const newType = await createTypeRent(newTypeName, newTypeDescription, newIsHotelType)

      if (newType) {
        setTypeRents([...typeRents, newType])
        setNewTypeName('')
        setNewTypeDescription('')
        setNewIsHotelType(false)
        setIsAddDialogOpen(false)
      } else {
        setError('Erreur lors de la création du type de logement')
      }
    } catch (err) {
      console.error('Erreur lors de la création:', err)
      setError('Erreur lors de la création du type de logement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditType = (type: TypeRentInterface) => {
    setEditingType(type)
    setEditTypeName(type.name || '')
    setEditTypeDescription(type.description || '')
    setEditIsHotelType(type.isHotelType || false)
    setIsEditDialogOpen(true)
  }

  const handleUpdateType = async () => {
    if (!editingType || !editTypeName.trim() || !editTypeDescription.trim()) return

    setIsSubmitting(true)
    try {
      const updatedType = await updateTypeRent(editingType.id, editTypeName, editTypeDescription, editIsHotelType)

      if (updatedType) {
        setTypeRents(typeRents.map(type => (type.id === editingType.id ? updatedType : type)))
        setEditTypeName('')
        setEditTypeDescription('')
        setEditIsHotelType(false)
        setEditingType(null)
        setIsEditDialogOpen(false)
      } else {
        setError('Erreur lors de la modification du type de logement')
      }
    } catch (err) {
      console.error('Erreur lors de la modification:', err)
      setError('Erreur lors de la modification du type de logement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteType = (type: TypeRentInterface) => {
    setDeletingType(type)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteSuccess = (typeId: string) => {
    setTypeRents(typeRents.filter(type => type.id !== typeId))
    setDeletingType(null)
    setIsDeleteModalOpen(false)
  }

  const handleDeleteError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 5000)
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center'>
        <div className='flex items-center gap-3'>
          <Loader2 className='h-6 w-6 animate-spin text-purple-600' />
          <p className='text-slate-600 text-lg'>Chargement des types de logements...</p>
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
        <motion.div className='flex items-center gap-4' variants={itemVariants}>
          <Button variant='ghost' size='sm' asChild className='text-slate-600 hover:text-slate-800'>
            <Link href='/admin' className='flex items-center gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Retour au panel admin
            </Link>
          </Button>
        </motion.div>

        {/* Page Header */}
        <motion.div className='text-center space-y-4' variants={itemVariants}>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium'>
            <Home className='h-4 w-4' />
            Types de Logements
          </div>
          <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-purple-700 to-indigo-700'>
            Gestion des types de logements
          </h1>
          <p className='text-slate-600 max-w-2xl mx-auto text-lg'>
            {typeRents.length} type{typeRents.length > 1 ? 's' : ''} de logement
            {typeRents.length > 1 ? 's' : ''} enregistré{typeRents.length > 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Search and Add */}
        <motion.div variants={itemVariants}>
          <div className='flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-0 shadow-lg'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4' />
              <Input
                placeholder='Rechercher un type de logement...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10 border-slate-200 focus:border-purple-300 focus:ring-purple-200'
              />
            </div>
            <div className='flex gap-3'>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className='bg-purple-600 hover:bg-purple-700 text-white shadow-lg'>
                    <Plus className='h-4 w-4 mr-2' />
                    Ajouter un type
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-[425px]'>
                  <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                      <Home className='h-5 w-5 text-purple-600' />
                      Ajouter un type de logement
                    </DialogTitle>
                    <DialogDescription>
                      Créez un nouveau type de logement pour votre plateforme.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='typeName'>Nom du type</Label>
                      <Input
                        id='typeName'
                        placeholder='Ex: Villa, Appartement, Maison...'
                        value={newTypeName}
                        onChange={e => setNewTypeName(e.target.value)}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='typeDescription'>Description</Label>
                      <Input
                        id='typeDescription'
                        placeholder='Description du type de logement...'
                        value={newTypeDescription}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewTypeDescription(e.target.value)
                        }
                      />
                    </div>
                    <div className='flex items-center space-x-2 pt-2'>
                      <Checkbox
                        id='isHotelType'
                        checked={newIsHotelType}
                        onCheckedChange={(checked) => setNewIsHotelType(checked as boolean)}
                      />
                      <Label 
                        htmlFor='isHotelType' 
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
                      >
                        <div className='flex items-center gap-2'>
                          <Hotel className='h-4 w-4 text-purple-600' />
                          <span>Fonctionne comme un hôtel (gestion multi-chambres)</span>
                        </div>
                      </Label>
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
                      onClick={handleAddType}
                      disabled={!newTypeName.trim() || !newTypeDescription.trim() || isSubmitting}
                      className='bg-purple-600 hover:bg-purple-700'
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
                      Modifier le type de logement
                    </DialogTitle>
                    <DialogDescription>
                      Modifiez les informations de ce type de logement.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='editTypeName'>Nom du type</Label>
                      <Input
                        id='editTypeName'
                        placeholder='Ex: Villa, Appartement, Maison...'
                        value={editTypeName}
                        onChange={e => setEditTypeName(e.target.value)}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='editTypeDescription'>Description</Label>
                      <Input
                        id='editTypeDescription'
                        placeholder='Description du type de logement...'
                        value={editTypeDescription}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditTypeDescription(e.target.value)
                        }
                      />
                    </div>
                    <div className='flex items-center space-x-2 pt-2'>
                      <Checkbox
                        id='editIsHotelType'
                        checked={editIsHotelType}
                        onCheckedChange={(checked) => setEditIsHotelType(checked as boolean)}
                      />
                      <Label 
                        htmlFor='editIsHotelType' 
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
                      >
                        <div className='flex items-center gap-2'>
                          <Hotel className='h-4 w-4 text-orange-600' />
                          <span>Fonctionne comme un hôtel (gestion multi-chambres)</span>
                        </div>
                      </Label>
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
                      onClick={handleUpdateType}
                      disabled={!editTypeName.trim() || !editTypeDescription.trim() || isSubmitting}
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

              {/* Modal de suppression améliorée */}
              <DeleteTypeModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                  setIsDeleteModalOpen(false)
                  setDeletingType(null)
                }}
                typeToDelete={deletingType}
                onDeleteSuccess={handleDeleteSuccess}
                onError={handleDeleteError}
              />
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div variants={itemVariants}>
          {filteredTypes.length === 0 ? (
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardContent className='text-center py-12'>
                <Home className='h-16 w-16 text-slate-300 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-slate-600 mb-2'>
                  {searchTerm ? 'Aucun résultat' : 'Aucun type de logement'}
                </h3>
                <p className='text-slate-500 mb-6'>
                  {searchTerm
                    ? 'Aucun type ne correspond à votre recherche.'
                    : 'Commencez par ajouter votre premier type de logement.'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className='bg-purple-600 hover:bg-purple-700'
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Ajouter un type
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch'>
              {filteredTypes.map((type, index) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group h-full'>
                    <CardHeader className='pb-3'>
                      <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors'>
                            <Home className='h-5 w-5 text-purple-600' />
                          </div>
                          <div>
                            <CardTitle className='text-lg font-semibold text-slate-800'>
                              {type.name || 'Type sans nom'}
                            </CardTitle>
                          </div>
                        </div>
                        <div className='flex gap-1'>
                          {type.isHotelType && (
                            <Badge
                              variant='secondary'
                              className='bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1'
                            >
                              <Hotel className='h-3 w-3' />
                              Hôtel
                            </Badge>
                          )}
                          <Badge
                            variant='secondary'
                            className='bg-green-50 text-green-700 border-green-200'
                          >
                            Actif
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='pt-0'>
                      <p className='text-slate-600 text-sm mb-4 line-clamp-2'>
                        {type.description || 'Aucune description'}
                      </p>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          asChild
                          className='flex-1 hover:bg-purple-50 hover:text-purple-600'
                        >
                          <Link href={`/admin/typeRent/${type.id}`}>
                            <Eye className='h-4 w-4 mr-2' />
                            Voir logements
                          </Link>
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='hover:bg-orange-50 hover:text-orange-600'
                          onClick={() => handleEditType(type)}
                        >
                          <Edit3 className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='hover:bg-red-50 hover:text-red-600'
                          onClick={() => handleDeleteType(type)}
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
