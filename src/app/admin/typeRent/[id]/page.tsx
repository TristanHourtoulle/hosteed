'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Checkbox } from '@/components/ui/shadcnui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui/dialog'
import { Label } from '@/components/ui/shadcnui/label'
import {
  Loader2,
  Search,
  Eye,
  Home,
  ArrowLeft,
  MapPin,
  Users,
  Euro,
  Edit,
  ExternalLink,
  Trash2,
  CheckCircle,
  Hotel,
} from 'lucide-react'
import { findTypeById, updateTypeRent } from '@/lib/services/typeRent.service'
import { TypeRentInterface } from '@/lib/interface/typeRentInterface'
import DeleteTypeModal from '../components/DeleteTypeModal'
import { ProductValidation } from '@prisma/client'

interface Product {
  id: string
  title: string | null
  status: string | null
}

interface ExtendedProduct extends Product {
  name: string
  address: string
  basePrice: string
  maxPeople: bigint | null
  validate: string
}

export default function TypeRentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const [typeRent, setTypeRent] = useState<TypeRentInterface | null>(null)
  const [products, setProducts] = useState<ExtendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // États pour l'édition
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editTypeName, setEditTypeName] = useState('')
  const [editTypeDescription, setEditTypeDescription] = useState('')
  const [editIsHotelType, setEditIsHotelType] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour la suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  useEffect(() => {
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer le type de logement
        const type = await findTypeById(id)
        if (!type) {
          setError('Type de logement introuvable')
          return
        }
        setTypeRent(type)

        // Récupérer les produits associés avec plus de détails
        const response = await fetch(`/api/admin/typeRent/${id}/products`)
        if (response.ok) {
          const productsData = await response.json()
          setProducts(productsData)
        }
      } catch (err) {
        setError('Erreur lors du chargement des données')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleEditType = () => {
    if (typeRent) {
      setEditTypeName(typeRent.name || '')
      setEditTypeDescription(typeRent.description || '')
      setEditIsHotelType(typeRent.isHotelType || false)
      setIsEditDialogOpen(true)
    }
  }

  const handleUpdateType = async () => {
    if (!typeRent || !editTypeName.trim() || !editTypeDescription.trim()) return

    setIsSubmitting(true)
    try {
      const updatedType = await updateTypeRent(
        typeRent.id,
        editTypeName,
        editTypeDescription,
        editIsHotelType
      )

      if (updatedType) {
        setTypeRent(updatedType)
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

  const handleDeleteSuccess = () => {
    router.push('/admin/typeRent')
  }

  const handleDeleteError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 5000)
  }

  const filteredProducts = products.filter(
    product =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'NotVerified':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'Validé'
      case 'Rejected':
        return 'Rejeté'
      case 'NotVerified':
        return 'En attente'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center'>
        <div className='flex items-center gap-3'>
          <Loader2 className='h-6 w-6 animate-spin text-purple-600' />
          <p className='text-slate-600 text-lg'>Chargement des données...</p>
        </div>
      </div>
    )
  }

  if (error || !typeRent) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <Alert variant='destructive'>
            <AlertDescription>{error || 'Type de logement introuvable'}</AlertDescription>
          </Alert>
          <Button variant='outline' className='mt-4' asChild>
            <Link href='/admin/typeRent'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Retour aux types
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <motion.div
        className='max-w-7xl mx-auto p-6 space-y-8'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header with breadcrumb */}
        <motion.div
          className='flex items-center gap-4'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant='ghost' size='sm' asChild className='text-slate-600 hover:text-slate-800'>
            <Link href='/admin/typeRent' className='flex items-center gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Retour aux types
            </Link>
          </Button>
        </motion.div>

        {/* Type Info Header */}
        <motion.div
          className='bg-white/70 backdrop-blur-sm rounded-2xl p-8 border-0 shadow-lg'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className='flex items-start justify-between'>
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div className='p-3 bg-purple-100 rounded-xl'>
                  <Home className='h-8 w-8 text-purple-600' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-slate-800'>{typeRent.name}</h1>
                  <p className='text-slate-600 mt-1'>{typeRent.description}</p>
                </div>
              </div>
              <div className='flex items-center gap-4 flex-wrap'>
                {typeRent.isHotelType && (
                  <Badge
                    variant='secondary'
                    className='bg-purple-50 text-purple-700 border-purple-200 px-3 py-1'
                  >
                    <Hotel className='h-3 w-3 mr-1' />
                    Type Hôtel
                  </Badge>
                )}
                <Badge variant='secondary' className='bg-blue-50 text-blue-700 px-3 py-1'>
                  <Home className='h-3 w-3 mr-1' />
                  {products.length} logement{products.length > 1 ? 's' : ''}
                </Badge>
                <Badge variant='secondary' className='bg-green-50 text-green-700 px-3 py-1'>
                  {products.filter(p => p.validate === ProductValidation.Approve).length} validé
                  {products.filter(p => p.validate === ProductValidation.Approve).length > 1 ? 's' : ''}
                </Badge>
                <Badge variant='secondary' className='bg-yellow-50 text-yellow-700 px-3 py-1'>
                  {products.filter(p => p.validate === ProductValidation.NotVerified).length} en attente
                </Badge>
              </div>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={handleEditType}>
                <Edit className='h-4 w-4 mr-2' />
                Modifier
              </Button>
              <Button
                variant='outline'
                className='hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Supprimer
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search bar */}
        <motion.div
          className='bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-0 shadow-lg'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4' />
            <Input
              placeholder='Rechercher un logement par nom ou adresse...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10 border-slate-200 focus:border-purple-300 focus:ring-purple-200'
            />
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          {filteredProducts.length === 0 ? (
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm'>
              <CardContent className='text-center py-12'>
                <Home className='h-16 w-16 text-slate-300 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-slate-600 mb-2'>
                  {searchTerm ? 'Aucun résultat' : 'Aucun logement'}
                </h3>
                <p className='text-slate-500'>
                  {searchTerm
                    ? 'Aucun logement ne correspond à votre recherche.'
                    : `Aucun logement n'utilise ce type "${typeRent.name}".`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group h-full'>
                    <CardHeader className='pb-3'>
                      <div className='flex items-start justify-between mb-2'>
                        <CardTitle className='text-lg font-semibold text-slate-800 line-clamp-1'>
                          {product.name || 'Sans nom'}
                        </CardTitle>
                        <Badge className={getStatusColor(product.validate)}>
                          {getStatusLabel(product.validate)}
                        </Badge>
                      </div>
                      <div className='space-y-2 text-sm text-slate-600'>
                        <div className='flex items-center gap-2'>
                          <MapPin className='h-4 w-4 text-slate-400' />
                          <span className='line-clamp-1'>
                            {product.address || 'Adresse non renseignée'}
                          </span>
                        </div>
                        <div className='flex items-center gap-4'>
                          <div className='flex items-center gap-1'>
                            <Euro className='h-4 w-4 text-slate-400' />
                            <span className='font-medium'>{product.basePrice || '0'}</span>
                          </div>
                          {product.maxPeople && (
                            <div className='flex items-center gap-1'>
                              <Users className='h-4 w-4 text-slate-400' />
                              <span>{product.maxPeople.toString()} pers.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='pt-0'>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          asChild
                          className='flex-1 hover:bg-purple-50 hover:text-purple-600'
                        >
                          <Link href={`/admin/products/${product.id}`}>
                            <Eye className='h-4 w-4 mr-2' />
                            Voir détails
                          </Link>
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          asChild
                          className='hover:bg-blue-50 hover:text-blue-600'
                        >
                          <Link href={`/host/${product.id}`} target='_blank'>
                            <ExternalLink className='h-4 w-4' />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Dialog d'édition */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className='sm:max-w-[425px]'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Edit className='h-5 w-5 text-orange-600' />
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
                  onCheckedChange={checked => setEditIsHotelType(checked as boolean)}
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

        {/* Modal de suppression */}
        <DeleteTypeModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
          }}
          typeToDelete={typeRent}
          onDeleteSuccess={handleDeleteSuccess}
          onError={handleDeleteError}
        />
      </motion.div>
    </div>
  )
}
