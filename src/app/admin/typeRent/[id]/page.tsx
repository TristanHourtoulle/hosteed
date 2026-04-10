'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Loader2,
  Home,
  Hotel,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Users,
  ExternalLink,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ImageIcon,
} from 'lucide-react'
import { ProductValidation } from '@prisma/client'

import { findTypeById, updateTypeRent } from '@/lib/services/typeRent.service'
import { TypeRentInterface } from '@/lib/interface/typeRentInterface'
import DeleteTypeModal from '../components/DeleteTypeModal'
import { toast } from 'sonner'

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
import { formatCurrency } from '@/lib/utils/formatNumber'

interface ExtendedProduct {
  id: string
  name: string
  address: string
  basePrice: string
  maxPeople: bigint | null
  validate: string
}

const VALIDATION_CONFIG: Record<
  string,
  { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }
> = {
  Approve: {
    label: 'Validé',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: CheckCircle2,
  },
  NotVerified: {
    label: 'En attente',
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: Clock,
  },
  Refused: {
    label: 'Rejeté',
    tone: 'bg-red-50 text-red-700 ring-red-200',
    icon: XCircle,
  },
  Recheck: {
    label: 'À revérifier',
    tone: 'bg-blue-50 text-blue-700 ring-blue-200',
    icon: AlertTriangle,
  },
}

function ValidationPill({ status }: { status: string }) {
  const config = VALIDATION_CONFIG[status] ?? {
    label: status,
    tone: 'bg-slate-50 text-slate-600 ring-slate-200',
    icon: Clock,
  }
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${config.tone}`}
    >
      <Icon className='h-3 w-3' />
      {config.label}
    </span>
  )
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

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editTypeName, setEditTypeName] = useState('')
  const [editTypeDescription, setEditTypeDescription] = useState('')
  const [editIsHotelType, setEditIsHotelType] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const isAdmin = session?.user?.roles === 'ADMIN'

  useEffect(() => {
    if (session && !isAdmin) {
      router.push('/')
    }
  }, [session, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return

    const fetchData = async () => {
      try {
        const type = await findTypeById(id)
        if (!type) {
          setError('Type de logement introuvable')
          return
        }
        setTypeRent(type)

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
  }, [id, isAdmin])

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      p =>
        p.name?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q)
    )
  }, [products, searchTerm])

  const stats = useMemo(() => {
    const total = products.length
    const approved = products.filter(p => p.validate === ProductValidation.Approve).length
    const pending = products.filter(p => p.validate === ProductValidation.NotVerified).length
    const refused = products.filter(p => p.validate === ProductValidation.Refused).length
    return { total, approved, pending, refused }
  }, [products])

  const handleEditType = () => {
    if (!typeRent) return
    setEditTypeName(typeRent.name || '')
    setEditTypeDescription(typeRent.description || '')
    setEditIsHotelType(typeRent.isHotelType || false)
    setIsEditDialogOpen(true)
  }

  const handleUpdateType = async () => {
    if (!typeRent || !editTypeName.trim() || !editTypeDescription.trim()) return

    setIsSubmitting(true)
    try {
      const updated = await updateTypeRent(
        typeRent.id,
        editTypeName,
        editTypeDescription,
        editIsHotelType
      )
      if (updated) {
        setTypeRent(updated)
        setIsEditDialogOpen(false)
        toast.success('Type de logement mis à jour')
      } else {
        toast.error('Erreur lors de la modification du type de logement')
      }
    } catch (err) {
      console.error('Erreur lors de la modification:', err)
      toast.error('Erreur lors de la modification du type de logement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Array<DataTableColumn<ExtendedProduct>> = [
    {
      key: 'name',
      header: 'Hébergement',
      sortable: true,
      sortAccessor: item => (item.name ?? '').toLowerCase(),
      render: item => (
        <div className='flex items-center gap-3 min-w-0'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600'>
            <Home className='h-4 w-4' />
          </div>
          <div className='min-w-0'>
            <p className='truncate text-sm font-semibold text-slate-900'>
              {item.name || 'Sans nom'}
            </p>
            <p className='flex items-center gap-1 truncate text-xs text-slate-500'>
              <MapPin className='h-3 w-3 shrink-0' />
              {item.address || 'Adresse non renseignée'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'basePrice',
      header: 'Prix de base',
      sortable: true,
      sortAccessor: item => parseFloat(item.basePrice || '0'),
      align: 'right',
      render: item => (
        <p className='text-sm font-semibold tabular-nums text-slate-900'>
          {formatCurrency(parseFloat(item.basePrice || '0'))}
        </p>
      ),
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'capacity',
      header: 'Capacité',
      sortable: true,
      sortAccessor: item => Number(item.maxPeople ?? 0),
      align: 'right',
      render: item => (
        <div className='flex items-center justify-end gap-1 text-sm text-slate-600'>
          <Users className='h-4 w-4 text-slate-400' />
          {item.maxPeople ? `${item.maxPeople.toString()} pers.` : '—'}
        </div>
      ),
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'validate',
      header: 'Validation',
      sortable: true,
      sortAccessor: item => item.validate,
      render: item => <ValidationPill status={item.validate} />,
      cellClassName: 'whitespace-nowrap',
    },
  ]

  if (loading) {
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

  if (error || !typeRent) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
        <div className='mx-auto max-w-4xl space-y-8 p-6'>
          <PageHeader
            backHref='/admin/typeRent'
            backLabel='Retour aux types'
            eyebrow='Espace administrateur'
            title='Type introuvable'
            subtitle='Ce type de logement n’existe pas ou a été supprimé.'
          />
          <div className='rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm'>
            <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600'>
              <AlertTriangle className='h-8 w-8' />
            </div>
            <h2 className='mt-4 text-lg font-bold text-slate-900'>
              {error || 'Type de logement introuvable'}
            </h2>
            <Button className='mt-6' asChild>
              <Link href='/admin/typeRent'>Retour aux types</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
      <motion.div
        className='mx-auto max-w-7xl space-y-8 p-6'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          backHref='/admin/typeRent'
          backLabel='Retour aux types'
          eyebrow='Espace administrateur'
          eyebrowIcon={Shield}
          title={typeRent.name || 'Type sans nom'}
          subtitle={typeRent.description || 'Aucune description'}
          actions={
            <div className='flex flex-wrap items-center gap-2'>
              {typeRent.isHotelType && (
                <span className='inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 ring-1 ring-purple-200'>
                  <Hotel className='h-3 w-3' />
                  Type hôtel
                </span>
              )}
              {typeRent.coverImage && (
                <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'>
                  <ImageIcon className='h-3 w-3' />
                  Image définie
                </span>
              )}
              <Button variant='outline' onClick={handleEditType} className='gap-2'>
                <Edit className='h-4 w-4' />
                Modifier
              </Button>
              <Button
                variant='outline'
                onClick={() => setIsDeleteModalOpen(true)}
                className='gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700'
              >
                <Trash2 className='h-4 w-4' />
                Supprimer
              </Button>
            </div>
          }
        />

        {/* KPI row */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <KpiCard
            label='Hébergements'
            value={stats.total}
            hint='utilisant ce type'
            icon={Home}
            tone='purple'
          />
          <KpiCard
            label='Validés'
            value={stats.approved}
            hint={`sur ${stats.total}`}
            icon={CheckCircle2}
            tone='emerald'
          />
          <KpiCard
            label='En attente'
            value={stats.pending}
            hint='à valider'
            icon={Clock}
            tone='amber'
          />
          <KpiCard
            label='Rejetés'
            value={stats.refused}
            hint='non publiés'
            icon={XCircle}
            tone='red'
          />
        </div>

        {/* Search */}
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder='Rechercher un hébergement par nom ou adresse…'
        />

        {/* Products table */}
        <DataTable<ExtendedProduct>
          columns={columns}
          rows={filteredProducts}
          getRowId={item => item.id}
          loading={false}
          rowActions={item => (
            <div className='flex items-center justify-end gap-1'>
              <Button variant='ghost' size='sm' asChild>
                <Link
                  href={`/admin/products/${item.id}`}
                  className='gap-1 text-slate-600 hover:text-slate-900'
                >
                  <Eye className='h-4 w-4' />
                  Détails
                </Link>
              </Button>
              <Button
                variant='ghost'
                size='sm'
                asChild
                className='text-slate-600 hover:text-blue-600'
              >
                <Link href={`/host/${item.id}`} target='_blank'>
                  <ExternalLink className='h-4 w-4' />
                </Link>
              </Button>
            </div>
          )}
          emptyState={{
            icon: Home,
            title: searchTerm ? 'Aucun résultat' : 'Aucun hébergement',
            subtitle: searchTerm
              ? 'Essayez d’ajuster votre recherche.'
              : `Aucun hébergement n'utilise ce type.`,
          }}
        />
      </motion.div>

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

      {/* Delete modal — redirects back to the list on success */}
      <DeleteTypeModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        typeToDelete={typeRent}
        onDeleteSuccess={() => router.push('/admin/typeRent')}
        onError={message => toast.error(message)}
      />
    </div>
  )
}
