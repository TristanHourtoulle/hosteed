'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, Plus, Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from './PageHeader'
import { KpiCard, type KpiTone } from './KpiCard'
import { FilterBar } from './FilterBar'
import { DataTable, type DataTableColumn } from './DataTable'
import { Button } from '@/components/ui/shadcnui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui/dialog'
import { Input } from '@/components/ui/shadcnui/input'
import { Label } from '@/components/ui/shadcnui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Data adapter for a taxonomy entity. Provides the four CRUD operations.
 * Implementations may wrap REST fetch calls or direct service function calls.
 */
export interface TaxonomyAdapter<T, FormData> {
  fetchAll: () => Promise<T[]>
  create: (data: FormData) => Promise<T | null>
  update: (id: string, data: FormData) => Promise<T | null>
  /** Delete the item. Return true on success. Throw an Error with a readable message on failure. */
  delete: (id: string) => Promise<boolean>
}

type FieldType = 'text' | 'textarea' | 'number' | 'select'

/**
 * Describes a single form field in the add/edit dialog.
 */
export interface TaxonomyField<FormData> {
  name: keyof FormData & string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  help?: string
  /** Required when `type === 'select'`. */
  options?: Array<{ value: string; label: string }>
  /** Applied to <input type="number">. */
  step?: string
  min?: string
}

export interface TaxonomyManagerProps<T, FormData extends object> {
  /** PageHeader eyebrow pill (e.g. "Espace administrateur"). */
  eyebrow?: string
  eyebrowIcon?: LucideIcon
  /** Main page title. */
  title: string
  subtitle?: string
  backHref?: string
  backLabel?: string

  /** Lucide icon representing this taxonomy. Used in KPIs and empty state. */
  icon: LucideIcon
  /** Optional color tone for the primary KPI. */
  kpiTone?: KpiTone

  /** Singular French label used in labels/toasts (e.g. "un point fort"). */
  itemLabelSingular: string
  /** Plural French label used in KPI hints (e.g. "points forts"). */
  itemLabelPlural: string

  /** Placeholder for the search input. */
  searchPlaceholder?: string
  /** Extracts a stable id from an item (used by DataTable). */
  getItemId: (item: T) => string
  /** Returns the display name (used in dialogs and delete confirmation). */
  getItemName: (item: T) => string
  /** Returns the "number of products using this" count. Return `undefined` if not applicable. */
  getItemCount?: (item: T) => number
  /** Returns true if the item matches the given lowercased query. */
  searchMatches: (item: T, queryLower: string) => boolean

  /** Columns to render in addition to the mandatory "Nom" column (which is auto-rendered). */
  extraColumns?: Array<DataTableColumn<T>>

  /** Form field definitions — determine what appears in the add/edit dialog. */
  fields: Array<TaxonomyField<FormData>>
  /** Empty form data used when opening "add" dialog and after reset. */
  emptyFormData: FormData
  /** Converts an item to form data when opening the "edit" dialog. */
  toFormData: (item: T) => FormData
  /** Custom client-side validation. Return an error message to block submit, or null to pass. */
  validate?: (formData: FormData) => string | null

  /** Data adapter backing this taxonomy. */
  adapter: TaxonomyAdapter<T, FormData>
}

/**
 * Generic, reusable CRUD manager for admin taxonomy pages.
 *
 * Provides PageHeader, KPI summary, search + DataTable, add/edit dialog, and a
 * delete confirmation dialog. Specialises per-page via the `fields`, `adapter`,
 * and `extraColumns` props.
 */
export function TaxonomyManager<T, FormData extends object>(
  props: TaxonomyManagerProps<T, FormData>
) {
  const {
    eyebrow,
    eyebrowIcon,
    title,
    subtitle,
    backHref,
    backLabel,
    icon: Icon,
    kpiTone = 'blue',
    itemLabelSingular,
    itemLabelPlural,
    searchPlaceholder,
    getItemId,
    getItemName,
    getItemCount,
    searchMatches,
    extraColumns = [],
    fields,
    emptyFormData,
    toFormData,
    validate,
    adapter,
  } = props

  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyFormData)
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const result = await adapter.fetchAll()
      setItems(result ?? [])
    } catch (error) {
      console.error(`Erreur lors du chargement des ${itemLabelPlural}:`, error)
      toast.error(`Erreur lors du chargement des ${itemLabelPlural}`)
    } finally {
      setLoading(false)
    }
    // adapter is expected to be stable; itemLabelPlural is a primitive string
  }, [adapter, itemLabelPlural])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const filteredItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) return items
    return items.filter(item => searchMatches(item, query))
  }, [items, searchValue, searchMatches])

  const stats = useMemo(() => {
    const total = items.length
    if (!getItemCount) return { total, inUse: 0, unused: 0, totalUsages: 0 }
    let inUse = 0
    let totalUsages = 0
    for (const item of items) {
      const count = getItemCount(item) ?? 0
      totalUsages += count
      if (count > 0) inUse += 1
    }
    return { total, inUse, unused: total - inUse, totalUsages }
  }, [items, getItemCount])

  const openAddDialog = () => {
    setEditingItem(null)
    setFormData(emptyFormData)
    setDialogOpen(true)
  }

  const openEditDialog = (item: T) => {
    setEditingItem(item)
    setFormData(toFormData(item))
    setDialogOpen(true)
  }

  const closeDialog = () => {
    if (submitting) return
    setDialogOpen(false)
    setEditingItem(null)
    setFormData(emptyFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validate) {
      const error = validate(formData)
      if (error) {
        toast.error(error)
        return
      }
    } else {
      // Default: require every `required` field to be non-empty
      for (const field of fields) {
        if (field.required) {
          const value = formData[field.name]
          if (value === undefined || value === null || String(value).trim() === '') {
            toast.error(`${field.label} est requis`)
            return
          }
        }
      }
    }

    try {
      setSubmitting(true)
      if (editingItem) {
        const updated = await adapter.update(getItemId(editingItem), formData)
        if (!updated) {
          toast.error('Erreur lors de la mise à jour')
          return
        }
        toast.success(`${capitalize(itemLabelSingular)} mis à jour`)
      } else {
        const created = await adapter.create(formData)
        if (!created) {
          toast.error('Erreur lors de la création')
          return
        }
        toast.success(`${capitalize(itemLabelSingular)} créé`)
      }
      setDialogOpen(false)
      setEditingItem(null)
      setFormData(emptyFormData)
      // Refetch to pick up derived fields such as `_count.products`.
      await fetchItems()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur lors de la sauvegarde'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      const success = await adapter.delete(getItemId(deleteTarget))
      if (!success) {
        toast.error('Erreur lors de la suppression')
        return
      }
      toast.success(`${capitalize(itemLabelSingular)} supprimé`)
      setDeleteTarget(null)
      await fetchItems()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur lors de la suppression'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  const nameColumn: DataTableColumn<T> = {
    key: 'name',
    header: 'Nom',
    sortable: true,
    sortAccessor: item => getItemName(item).toLowerCase(),
    render: item => (
      <div className='flex items-center gap-3 min-w-0'>
        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600'>
          <Icon className='h-4 w-4' />
        </div>
        <p className='truncate text-sm font-semibold text-slate-900'>
          {getItemName(item)}
        </p>
      </div>
    ),
  }

  const countColumn: DataTableColumn<T> | null = getItemCount
    ? {
        key: 'count',
        header: 'Utilisations',
        sortable: true,
        sortAccessor: item => getItemCount(item) ?? 0,
        align: 'right',
        render: item => {
          const count = getItemCount(item) ?? 0
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
      }
    : null

  const columns: Array<DataTableColumn<T>> = [
    nameColumn,
    ...extraColumns,
    ...(countColumn ? [countColumn] : []),
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
      <motion.div
        className='mx-auto max-w-7xl space-y-8 p-6'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          backHref={backHref}
          backLabel={backLabel}
          eyebrow={eyebrow}
          eyebrowIcon={eyebrowIcon}
          title={title}
          subtitle={subtitle}
          actions={
            <Button onClick={openAddDialog} className='gap-2'>
              <Plus className='h-4 w-4' />
              Ajouter
            </Button>
          }
        />

        {/* KPI row */}
        <div
          className={`grid gap-4 ${
            getItemCount ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'
          }`}
        >
          <KpiCard
            label={`Total ${itemLabelPlural}`}
            value={stats.total}
            hint='enregistrés dans le catalogue'
            icon={Icon}
            tone={kpiTone}
            loading={loading}
          />
          {getItemCount && (
            <>
              <KpiCard
                label='Utilisés'
                value={stats.inUse}
                hint={`sur ${stats.total} au total`}
                icon={Icon}
                tone='emerald'
                loading={loading}
              />
              <KpiCard
                label='Associations totales'
                value={stats.totalUsages}
                hint={`produit${stats.totalUsages > 1 ? 's' : ''} concerné${stats.totalUsages > 1 ? 's' : ''}`}
                icon={Icon}
                tone='indigo'
                loading={loading}
              />
            </>
          )}
          {!getItemCount && (
            <KpiCard
              label='Affichés'
              value={filteredItems.length}
              hint='après filtres'
              icon={Icon}
              tone='indigo'
              loading={loading}
            />
          )}
        </div>

        {/* Search */}
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder={searchPlaceholder ?? `Rechercher un ${itemLabelSingular}…`}
        />

        {/* Data table */}
        <DataTable<T>
          columns={columns}
          rows={filteredItems}
          getRowId={getItemId}
          loading={loading}
          rowActions={item => (
            <div className='flex items-center justify-end gap-1'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => openEditDialog(item)}
                className='text-slate-600 hover:text-slate-900'
              >
                <Edit className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setDeleteTarget(item)}
                className='text-red-600 hover:bg-red-50 hover:text-red-700'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          )}
          emptyState={{
            icon: Icon,
            title: `Aucun ${itemLabelSingular}`,
            subtitle:
              searchValue.trim().length > 0
                ? 'Essayez d’ajuster votre recherche.'
                : `Commencez par ajouter votre premier ${itemLabelSingular}.`,
          }}
        />
      </motion.div>

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => !open && closeDialog()}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <div className='flex items-start gap-3'>
              <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100'>
                <Icon className='h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1 space-y-1'>
                <DialogTitle className='text-lg'>
                  {editingItem ? 'Modifier' : 'Ajouter'} {itemLabelSingular}
                </DialogTitle>
                <DialogDescription className='text-sm text-slate-600'>
                  {editingItem
                    ? `Mettez à jour les informations de ${itemLabelSingular}.`
                    : `Créez ${itemLabelSingular} pour le catalogue.`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4 py-2'>
            {fields.map(field => (
              <div key={field.name} className='space-y-1.5'>
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className='ml-0.5 text-red-500'>*</span>}
                </Label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    value={(formData[field.name] as string | undefined) ?? ''}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, [field.name]: e.target.value }))
                    }
                    rows={3}
                    placeholder={field.placeholder}
                    className='w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  />
                ) : field.type === 'select' ? (
                  <Select
                    value={(formData[field.name] as string | undefined) ?? ''}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, [field.name]: value }))
                    }
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder={field.placeholder ?? 'Sélectionner…'} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type === 'number' ? 'number' : 'text'}
                    step={field.step}
                    min={field.min}
                    value={(formData[field.name] as string | number | undefined) ?? ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        [field.name]:
                          field.type === 'number' ? e.target.value : e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                  />
                )}
                {field.help && <p className='text-xs text-slate-500'>{field.help}</p>}
              </div>
            ))}

            <DialogFooter className='gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={closeDialog}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type='submit' disabled={submitting} className='gap-2'>
                {submitting ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    {editingItem ? 'Mise à jour…' : 'Création…'}
                  </>
                ) : editingItem ? (
                  'Mettre à jour'
                ) : (
                  'Créer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => !open && !deleting && setDeleteTarget(null)}
      >
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <div className='flex items-start gap-3'>
              <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100'>
                <AlertTriangle className='h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1 space-y-1'>
                <DialogTitle className='text-lg'>
                  Supprimer {itemLabelSingular}
                </DialogTitle>
                <DialogDescription className='text-sm text-slate-600'>
                  {deleteTarget ? (
                    <>
                      Cette action supprimera définitivement{' '}
                      <span className='font-semibold text-slate-900'>
                        {getItemName(deleteTarget)}
                      </span>
                      . Elle est <strong>irréversible</strong>.
                    </>
                  ) : null}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteTarget && getItemCount && (getItemCount(deleteTarget) ?? 0) > 0 && (
            <div className='flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm'>
              <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
              <p className='text-amber-800'>
                Cet élément est actuellement utilisé par{' '}
                <strong>{getItemCount(deleteTarget)}</strong> produit
                {(getItemCount(deleteTarget) ?? 0) > 1 ? 's' : ''}. La suppression
                pourrait affecter ces hébergements.
              </p>
            </div>
          )}

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={deleting}
              className='gap-2'
            >
              {deleting ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Suppression…
                </>
              ) : (
                <>
                  <Trash2 className='h-4 w-4' />
                  Supprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
