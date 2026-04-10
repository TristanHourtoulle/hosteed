'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Home,
  Hotel,
  Plus,
  Eye,
  Edit,
  Trash2,
  Shield,
  Loader2,
  ImageIcon,
  CheckCircle2,
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/hooks/useAdminAuth'
import { findAllTypeRent, createTypeRent, updateTypeRent } from '@/lib/services/typeRent.service'
import { TypeRentInterface } from '@/lib/interface/typeRentInterface'
import DeleteTypeModal from './components/DeleteTypeModal'
import ImageUpload from './components/ImageUpload'

import { PageHeader } from '@/components/admin/ui/PageHeader'
import { KpiCard } from '@/components/admin/ui/KpiCard'
import { FilterBar } from '@/components/admin/ui/FilterBar'
import { DataTable, type DataTableColumn } from '@/components/admin/ui/DataTable'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/shadcnui/input'
import { Label } from '@/components/ui/shadcnui/label'
import { Checkbox } from '@/components/ui/shadcnui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui/dialog'

interface TypeRentWithCount extends TypeRentInterface {
  _count?: { products: number }
}

export default function TypeRentPage() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()

  const [typeRents, setTypeRents] = useState<TypeRentWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Add dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeDescription, setNewTypeDescription] = useState('')
  const [newIsHotelType, setNewIsHotelType] = useState(false)
  const [newCoverImage, setNewCoverImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<TypeRentWithCount | null>(null)
  const [editTypeName, setEditTypeName] = useState('')
  const [editTypeDescription, setEditTypeDescription] = useState('')
  const [editIsHotelType, setEditIsHotelType] = useState(false)
  const [editCoverImage, setEditCoverImage] = useState<string | null>(null)

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingType, setDeletingType] = useState<TypeRentInterface | null>(null)

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  useEffect(() => {
    const fetchTypeRents = async () => {
      try {
        const data = await findAllTypeRent()
        if (data) setTypeRents(data as TypeRentWithCount[])
      } catch (error) {
        console.error('Erreur lors du chargement des types:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTypeRents()
  }, [])

  const filteredTypes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return typeRents
    return typeRents.filter(
      type =>
        type.name?.toLowerCase().includes(query) ||
        type.description?.toLowerCase().includes(query)
    )
  }, [typeRents, searchTerm])

  const stats = useMemo(() => {
    const total = typeRents.length
    const hotelCount = typeRents.filter(t => t.isHotelType).length
    const withImage = typeRents.filter(t => Boolean(t.coverImage)).length
    const totalUsages = typeRents.reduce(
      (sum, t) => sum + (t._count?.products ?? 0),
      0
    )
    return { total, hotelCount, withImage, totalUsages }
  }, [typeRents])

  const resetNewForm = () => {
    setNewTypeName('')
    setNewTypeDescription('')
    setNewIsHotelType(false)
    setNewCoverImage(null)
  }

  const handleAddType = async () => {
    if (!newTypeName.trim() || !newTypeDescription.trim()) return

    setIsSubmitting(true)
    try {
      const newType = await createTypeRent(
        newTypeName,
        newTypeDescription,
        newIsHotelType,
        newCoverImage || undefined
      )
      if (newType) {
        setTypeRents(prev => [...prev, newType as TypeRentWithCount])
        resetNewForm()
        setIsAddDialogOpen(false)
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditType = (type: TypeRentWithCount) => {
    setEditingType(type)
    setEditTypeName(type.name || '')
    setEditTypeDescription(type.description || '')
    setEditIsHotelType(type.isHotelType || false)
    setEditCoverImage(type.coverImage || null)
    setIsEditDialogOpen(true)
  }

  const handleUpdateType = async () => {
    if (!editingType || !editTypeName.trim() || !editTypeDescription.trim()) return

    setIsSubmitting(true)
    try {
      const updated = await updateTypeRent(
        editingType.id,
        editTypeName,
        editTypeDescription,
        editIsHotelType,
        editCoverImage
      )
      if (updated) {
        setTypeRents(prev =>
          prev.map(t =>
            t.id === editingType.id ? ({ ...updated, _count: t._count } as TypeRentWithCount) : t
          )
        )
        setEditingType(null)
        setIsEditDialogOpen(false)
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteType = (type: TypeRentWithCount) => {
    setDeletingType(type)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteSuccess = (typeId: string) => {
    setTypeRents(prev => prev.filter(t => t.id !== typeId))
    setDeletingType(null)
    setIsDeleteModalOpen(false)
  }

  const columns: Array<DataTableColumn<TypeRentWithCount>> = [
    {
      key: 'name',
      header: 'Type de logement',
      sortable: true,
      sortAccessor: item => (item.name ?? '').toLowerCase(),
      render: item => (
        <div className='flex items-center gap-3 min-w-0'>
          <div className='relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-sm'>
            {item.coverImage ? (
              <Image
                src={item.coverImage}
                alt={item.name || 'Type'}
                fill
                className='object-cover'
                sizes='44px'
                unoptimized
              />
            ) : (
              <Home className='h-5 w-5' />
            )}
          </div>
          <div className='min-w-0'>
            <p className='truncate text-sm font-semibold text-slate-900'>
              {item.name || 'Type sans nom'}
            </p>
            <p className='truncate text-xs text-slate-500'>
              {item.description || 'Aucune description'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'flags',
      header: 'Caractéristiques',
      render: item => (
        <div className='flex flex-wrap items-center gap-1.5'>
          {item.isHotelType && (
            <span className='inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-200'>
              <Hotel className='h-3 w-3' />
              Hôtel
            </span>
          )}
          {item.coverImage ? (
            <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'>
              <ImageIcon className='h-3 w-3' />
              Image
            </span>
          ) : (
            <span className='inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200'>
              Sans image
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'count',
      header: 'Produits',
      sortable: true,
      sortAccessor: item => item._count?.products ?? 0,
      align: 'right',
      render: item => {
        const count = item._count?.products ?? 0
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
              count > 0
                ? 'bg-blue-50 text-blue-700 ring-blue-200'
                : 'bg-slate-50 text-slate-600 ring-slate-200'
            }`}
          >
            {count} produit{count > 1 ? 's' : ''}
          </span>
        )
      },
      cellClassName: 'whitespace-nowrap',
    },
  ]

  if (isAuthLoading || loading) {
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
        <PageHeader
          backHref='/admin'
          backLabel='Retour au panel admin'
          eyebrow='Espace administrateur'
          eyebrowIcon={Shield}
          title='Types de logements'
          subtitle='Gérez les catégories d’hébergements disponibles sur la plateforme (villa, appartement, hôtel, etc.).'
          actions={
            <Button onClick={() => setIsAddDialogOpen(true)} className='gap-2'>
              <Plus className='h-4 w-4' />
              Ajouter un type
            </Button>
          }
        />

        {/* KPI row */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <KpiCard
            label='Types enregistrés'
            value={stats.total}
            hint='dans le catalogue'
            icon={Home}
            tone='purple'
          />
          <KpiCard
            label='Types hôteliers'
            value={stats.hotelCount}
            hint='gestion multi-chambres'
            icon={Hotel}
            tone='indigo'
          />
          <KpiCard
            label='Avec image'
            value={stats.withImage}
            hint={`sur ${stats.total} au total`}
            icon={ImageIcon}
            tone='emerald'
          />
          <KpiCard
            label='Produits catégorisés'
            value={stats.totalUsages}
            hint='hébergements concernés'
            icon={CheckCircle2}
            tone='blue'
          />
        </div>

        {/* Search */}
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder='Rechercher un type de logement…'
        />

        {/* Table */}
        <DataTable<TypeRentWithCount>
          columns={columns}
          rows={filteredTypes}
          getRowId={item => item.id}
          loading={loading}
          rowActions={item => (
            <div className='flex items-center justify-end gap-1'>
              <Button variant='ghost' size='sm' asChild>
                <Link
                  href={`/admin/typeRent/${item.id}`}
                  className='gap-1 text-slate-600 hover:text-slate-900'
                >
                  <Eye className='h-4 w-4' />
                  Voir
                </Link>
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handleEditType(item)}
                className='text-slate-600 hover:text-slate-900'
              >
                <Edit className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handleDeleteType(item)}
                className='text-red-600 hover:bg-red-50 hover:text-red-700'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          )}
          emptyState={{
            icon: Home,
            title: searchTerm ? 'Aucun résultat' : 'Aucun type de logement',
            subtitle: searchTerm
              ? 'Essayez d’ajuster votre recherche.'
              : 'Commencez par ajouter votre premier type de logement.',
          }}
        />
      </motion.div>

      {/* Add dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={open => {
          setIsAddDialogOpen(open)
          if (!open) resetNewForm()
        }}
      >
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <div className='flex items-start gap-3'>
              <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100'>
                <Home className='h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1 space-y-1'>
                <DialogTitle className='text-lg'>Ajouter un type de logement</DialogTitle>
                <DialogDescription className='text-sm text-slate-600'>
                  Créez un nouveau type de logement pour votre plateforme.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className='space-y-4 py-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='typeName'>
                Nom <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='typeName'
                placeholder='Ex: Villa, Appartement, Hôtel'
                value={newTypeName}
                onChange={e => setNewTypeName(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='typeDescription'>
                Description <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='typeDescription'
                placeholder='Description du type de logement…'
                value={newTypeDescription}
                onChange={e => setNewTypeDescription(e.target.value)}
              />
            </div>
            <ImageUpload
              currentImage={newCoverImage}
              onImageChange={setNewCoverImage}
              entityType='type-rent'
            />
            <div className='flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3'>
              <Checkbox
                id='isHotelType'
                checked={newIsHotelType}
                onCheckedChange={checked => setNewIsHotelType(checked === true)}
              />
              <Label htmlFor='isHotelType' className='cursor-pointer space-y-0.5'>
                <span className='flex items-center gap-1.5 text-sm font-medium text-slate-900'>
                  <Hotel className='h-4 w-4 text-purple-600' />
                  Fonctionne comme un hôtel
                </span>
                <span className='text-xs text-slate-500'>
                  Active la gestion multi-chambres pour ce type.
                </span>
              </Label>
            </div>
          </div>

          <DialogFooter className='gap-2'>
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
              className='gap-2'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Création…
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <div className='flex items-start gap-3'>
              <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100'>
                <Edit className='h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1 space-y-1'>
                <DialogTitle className='text-lg'>Modifier le type de logement</DialogTitle>
                <DialogDescription className='text-sm text-slate-600'>
                  Mettez à jour les informations de ce type.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className='space-y-4 py-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='editTypeName'>
                Nom <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='editTypeName'
                value={editTypeName}
                onChange={e => setEditTypeName(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='editTypeDescription'>
                Description <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='editTypeDescription'
                value={editTypeDescription}
                onChange={e => setEditTypeDescription(e.target.value)}
              />
            </div>
            <ImageUpload
              currentImage={editCoverImage}
              onImageChange={setEditCoverImage}
              entityType='type-rent'
              entityId={editingType?.id}
            />
            <div className='flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3'>
              <Checkbox
                id='editIsHotelType'
                checked={editIsHotelType}
                onCheckedChange={checked => setEditIsHotelType(checked === true)}
              />
              <Label htmlFor='editIsHotelType' className='cursor-pointer space-y-0.5'>
                <span className='flex items-center gap-1.5 text-sm font-medium text-slate-900'>
                  <Hotel className='h-4 w-4 text-purple-600' />
                  Fonctionne comme un hôtel
                </span>
                <span className='text-xs text-slate-500'>
                  Active la gestion multi-chambres pour ce type.
                </span>
              </Label>
            </div>
          </div>

          <DialogFooter className='gap-2'>
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
              className='gap-2'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Mise à jour…
                </>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete modal (specialised — checks for associated products) */}
      <DeleteTypeModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingType(null)
        }}
        typeToDelete={deletingType}
        onDeleteSuccess={handleDeleteSuccess}
        onError={message => console.error(message)}
      />
    </div>
  )
}
