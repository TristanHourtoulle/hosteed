'use client'

import React, { useMemo } from 'react'
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react'

export interface DataTableColumn<T> {
  /** Unique key for the column. */
  key: string
  /** Column header label. */
  header: string
  /** Render the cell for a given row. */
  render: (row: T) => React.ReactNode
  /** Whether the column is sortable. */
  sortable?: boolean
  /** Accessor to extract the sort value (required if sortable). */
  sortAccessor?: (row: T) => string | number | Date | null | undefined
  /** Horizontal alignment. Defaults to 'left'. */
  align?: 'left' | 'center' | 'right'
  /** Optional CSS class for the cell (e.g. to cap width). */
  cellClassName?: string
  /** Optional CSS class for the header cell. */
  headerClassName?: string
}

export interface DataTableSort {
  key: string
  direction: 'asc' | 'desc'
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  /** Stable unique id for each row (used as React key and for selection). */
  getRowId: (row: T) => string
  /** Loading state — renders skeleton rows. */
  loading?: boolean
  /** Number of skeleton rows to render while loading. */
  skeletonRows?: number
  /** Current sort state (controlled). */
  sort?: DataTableSort | null
  /** Called when a sortable header is clicked. */
  onSortChange?: (sort: DataTableSort) => void
  /** If provided, the table renders a leading checkbox column for selection. */
  selection?: {
    selectedIds: Set<string>
    onSelectionChange: (selectedIds: Set<string>) => void
  }
  /** Optional per-row actions column rendered on the right. */
  rowActions?: (row: T) => React.ReactNode
  /** Empty state when there are no rows and loading is false. */
  emptyState?: {
    icon?: LucideIcon
    title: string
    subtitle?: string
  }
  /** Optional row href — makes the row clickable (via full-row link). */
  getRowHref?: (row: T) => string | null
  /** Extra className for the outer wrapper. */
  className?: string
}

function defaultSortComparator<T>(
  a: T,
  b: T,
  accessor: (row: T) => string | number | Date | null | undefined,
  direction: 'asc' | 'desc'
): number {
  const av = accessor(a)
  const bv = accessor(b)
  const dir = direction === 'asc' ? 1 : -1

  if (av == null && bv == null) return 0
  if (av == null) return 1 * dir
  if (bv == null) return -1 * dir

  if (av instanceof Date && bv instanceof Date) {
    return (av.getTime() - bv.getTime()) * dir
  }
  if (typeof av === 'number' && typeof bv === 'number') {
    return (av - bv) * dir
  }
  return String(av).localeCompare(String(bv), 'fr', { sensitivity: 'base' }) * dir
}

/**
 * Generic data table for admin pages.
 *
 * Usage:
 *   <DataTable
 *     columns={[{ key: 'name', header: 'Name', render: r => r.name, sortable: true, sortAccessor: r => r.name }]}
 *     rows={users}
 *     getRowId={u => u.id}
 *     sort={sort}
 *     onSortChange={setSort}
 *     selection={{ selectedIds, onSelectionChange: setSelectedIds }}
 *     rowActions={row => <DropdownMenu>...</DropdownMenu>}
 *     emptyState={{ title: 'Aucun utilisateur', subtitle: 'Ajustez vos filtres.' }}
 *   />
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading = false,
  skeletonRows = 6,
  sort,
  onSortChange,
  selection,
  rowActions,
  emptyState,
  className = '',
}: DataTableProps<T>) {
  // Optional client-side sorting (only applied if we have a sortable column selected AND the consumer doesn't handle it server-side).
  // We always return rows as-is if there's no sort or no sortAccessor — consumers with server sorting control the data directly.
  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const col = columns.find(c => c.key === sort.key)
    if (!col?.sortAccessor) return rows
    return [...rows].sort((a, b) => defaultSortComparator(a, b, col.sortAccessor!, sort.direction))
  }, [rows, sort, columns])

  const allSelected =
    selection && rows.length > 0 && rows.every(r => selection.selectedIds.has(getRowId(r)))
  const someSelected =
    selection && !allSelected && rows.some(r => selection.selectedIds.has(getRowId(r)))

  const toggleAll = () => {
    if (!selection) return
    const next = new Set(selection.selectedIds)
    if (allSelected) {
      rows.forEach(r => next.delete(getRowId(r)))
    } else {
      rows.forEach(r => next.add(getRowId(r)))
    }
    selection.onSelectionChange(next)
  }

  const toggleRow = (id: string) => {
    if (!selection) return
    const next = new Set(selection.selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selection.onSelectionChange(next)
  }

  const handleHeaderClick = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSortChange) return
    if (sort?.key === column.key) {
      onSortChange({
        key: column.key,
        direction: sort.direction === 'asc' ? 'desc' : 'asc',
      })
    } else {
      onSortChange({ key: column.key, direction: 'asc' })
    }
  }

  const alignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'text-center'
    if (align === 'right') return 'text-right'
    return 'text-left'
  }

  const showEmpty = !loading && rows.length === 0 && emptyState
  const EmptyIcon = emptyState?.icon

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}
    >
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase tracking-wide text-slate-500'>
              {selection && (
                <th className='w-10 px-4 py-3'>
                  <input
                    type='checkbox'
                    className='h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500'
                    checked={!!allSelected}
                    ref={el => {
                      if (el) el.indeterminate = !!someSelected
                    }}
                    onChange={toggleAll}
                    aria-label='Sélectionner toutes les lignes'
                  />
                </th>
              )}
              {columns.map(col => {
                const isActive = sort?.key === col.key
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-3 ${alignClass(col.align)} ${col.headerClassName ?? ''} ${
                      col.sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''
                    }`}
                    onClick={() => handleHeaderClick(col)}
                  >
                    <span className='inline-flex items-center gap-1'>
                      {col.header}
                      {col.sortable && (
                        <span className='text-slate-400'>
                          {isActive && sort?.direction === 'asc' ? (
                            <ChevronUp className='h-3 w-3' />
                          ) : isActive && sort?.direction === 'desc' ? (
                            <ChevronDown className='h-3 w-3' />
                          ) : (
                            <ChevronDown className='h-3 w-3 opacity-30' />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
              {rowActions && <th className='w-10 px-4 py-3' />}
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={`skeleton-${i}`} className='animate-pulse'>
                  {selection && (
                    <td className='px-4 py-4'>
                      <div className='h-4 w-4 rounded bg-slate-200' />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} className='px-4 py-4'>
                      <div className='h-4 w-3/4 rounded bg-slate-200' />
                    </td>
                  ))}
                  {rowActions && (
                    <td className='px-4 py-4'>
                      <div className='h-6 w-6 rounded bg-slate-200' />
                    </td>
                  )}
                </tr>
              ))
            ) : sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selection ? 1 : 0) + (rowActions ? 1 : 0)}
                  className='px-4 py-16'
                >
                  {showEmpty && (
                    <div className='flex flex-col items-center justify-center text-center'>
                      <div className='mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400'>
                        {EmptyIcon ? <EmptyIcon className='h-7 w-7' /> : null}
                      </div>
                      <h3 className='text-base font-semibold text-slate-900'>
                        {emptyState.title}
                      </h3>
                      {emptyState.subtitle && (
                        <p className='mt-1 max-w-sm text-sm text-slate-500'>
                          {emptyState.subtitle}
                        </p>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              sortedRows.map(row => {
                const id = getRowId(row)
                const isSelected = selection?.selectedIds.has(id)
                return (
                  <tr
                    key={id}
                    className={`transition ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
                  >
                    {selection && (
                      <td className='px-4 py-3'>
                        <input
                          type='checkbox'
                          className='h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500'
                          checked={!!isSelected}
                          onChange={() => toggleRow(id)}
                          aria-label={`Sélectionner la ligne ${id}`}
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${alignClass(col.align)} ${col.cellClassName ?? ''}`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className='px-4 py-3 text-right'>{rowActions(row)}</td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
