'use client'

import Link from 'next/link'
import { MapPin, Calendar, Home, CalendarClock, ArrowUpRight, Receipt } from 'lucide-react'
import { KpiCard } from '@/components/admin/ui/KpiCard'
import type { ExtendedUser, ExtendedRent } from '../types'
import { Product } from '@prisma/client'

interface UserListingsAndBookingsProps {
  user: ExtendedUser
}

const PAYMENT_PAID_STATES = new Set([
  'CLIENT_PAID',
  'MID_TRANSFER_REQ',
  'MID_TRANSFER_DONE',
  'REST_TRANSFER_REQ',
  'REST_TRANSFER_DONE',
  'FULL_TRANSFER_REQ',
  'FULL_TRANSFER_DONE',
])

const VALIDATION_LABEL: Record<string, { label: string; tone: string }> = {
  Approve: { label: 'Validé', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  NotVerified: { label: 'En attente', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
  RecheckRequest: {
    label: 'Révision demandée',
    tone: 'bg-orange-50 text-orange-700 ring-orange-200',
  },
  Refused: { label: 'Refusé', tone: 'bg-red-50 text-red-700 ring-red-200' },
  ModificationPending: {
    label: 'Modification en attente',
    tone: 'bg-purple-50 text-purple-700 ring-purple-200',
  },
}

const RENT_STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  WAITING: { label: 'En attente', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
  RESERVED: { label: 'Réservée', tone: 'bg-blue-50 text-blue-700 ring-blue-200' },
  CHECKIN: { label: 'Check-in', tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  CHECKOUT: { label: 'Check-out', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  CANCEL: { label: 'Annulée', tone: 'bg-red-50 text-red-700 ring-red-200' },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function UserListingsAndBookings({ user }: UserListingsAndBookingsProps) {
  const products: Product[] = user.Product ?? []
  const rents: ExtendedRent[] = user.Rent ?? []

  const paidRents = rents.filter(r => PAYMENT_PAID_STATES.has(r.payment as unknown as string))
  const totalSpent = paidRents.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0)

  const activeListings = products.filter(
    p => (p as Product).validate === 'Approve' && !(p as Product).isDraft
  ).length

  return (
    <div className='space-y-6'>
      {/* Stats row */}
      <div className='grid gap-4 md:grid-cols-3'>
        <KpiCard
          label='Dépensé total'
          value={formatCurrency(totalSpent)}
          hint='sur les réservations payées'
          icon={Receipt}
          tone='emerald'
        />
        <KpiCard
          label='Annonces actives'
          value={activeListings}
          hint={`${products.length} au total`}
          icon={Home}
          tone='blue'
        />
        <KpiCard
          label='Réservations'
          value={rents.length}
          hint={`${paidRents.length} payées`}
          icon={Calendar}
          tone='purple'
        />
      </div>

      {/* Listings */}
      <div className='rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-slate-900'>
            Annonces possédées{' '}
            <span className='text-sm font-normal text-slate-500'>({products.length})</span>
          </h3>
          {products.length > 0 && (
            <Link
              href={`/admin/products?ownerId=${user.id}`}
              className='text-xs font-medium text-blue-600 hover:underline'
            >
              Voir tout
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center'>
            <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400'>
              <Home className='h-6 w-6' />
            </div>
            <p className='text-sm font-semibold text-slate-900'>Aucune annonce</p>
            <p className='mt-0.5 text-xs text-slate-500'>
              Cet utilisateur n’a pas encore créé d’annonce.
            </p>
          </div>
        ) : (
          <div className='space-y-2'>
            {products.map(product => {
              const validation =
                VALIDATION_LABEL[product.validate] ?? {
                  label: product.validate,
                  tone: 'bg-slate-100 text-slate-700 ring-slate-200',
                }
              return (
                <Link
                  key={product.id}
                  href={`/admin/validation/${product.id}`}
                  className='group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50/30'
                >
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600'>
                    <Home className='h-5 w-5' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold text-slate-900 group-hover:text-blue-700'>
                      {product.name}
                    </p>
                    <p className='truncate text-xs text-slate-500'>
                      <MapPin className='mr-1 inline h-3 w-3' />
                      {product.address}
                    </p>
                  </div>
                  <div className='flex items-center gap-3'>
                    <span className='text-sm font-bold text-slate-900 tabular-nums'>
                      {product.basePrice}€
                      <span className='text-xs font-normal text-slate-500'>/nuit</span>
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${validation.tone}`}
                    >
                      {validation.label}
                    </span>
                    <ArrowUpRight className='h-4 w-4 text-slate-300 transition group-hover:text-slate-600' />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Bookings */}
      <div className='rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-slate-900'>
            Réservations effectuées{' '}
            <span className='text-sm font-normal text-slate-500'>({rents.length})</span>
          </h3>
        </div>

        {rents.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center'>
            <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400'>
              <Calendar className='h-6 w-6' />
            </div>
            <p className='text-sm font-semibold text-slate-900'>Aucune réservation</p>
            <p className='mt-0.5 text-xs text-slate-500'>
              Cet utilisateur n’a effectué aucune réservation.
            </p>
          </div>
        ) : (
          <div className='space-y-2'>
            {rents.map(rent => {
              const status = RENT_STATUS_LABEL[rent.status as unknown as string] ?? {
                label: rent.status,
                tone: 'bg-slate-100 text-slate-700 ring-slate-200',
              }
              return (
                <div
                  key={rent.id}
                  className='flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3'
                >
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600'>
                    <CalendarClock className='h-5 w-5' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold text-slate-900'>
                      Réservation #{rent.id.slice(-6)}
                    </p>
                    <p className='truncate text-xs text-slate-500'>
                      <Calendar className='mr-1 inline h-3 w-3' />
                      {new Date(rent.arrivingDate).toLocaleDateString('fr-FR')} →{' '}
                      {new Date(rent.leavingDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className='flex items-center gap-3'>
                    {rent.totalAmount != null && (
                      <span className='text-sm font-bold text-slate-900 tabular-nums'>
                        {formatCurrency(rent.totalAmount)}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${status.tone}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
