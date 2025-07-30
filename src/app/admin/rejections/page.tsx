'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getAllRentRejections, resolveRentRejection } from '@/lib/services/rents.service'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
  Mail,
  MapPin,
  MessageSquare,
  User,
  XCircle,
  Shield,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Separator } from '@/components/ui/shadcnui/separator'
import { AdminFilterBar } from '../components/AdminFilterBar'
import { InfoCardGrid } from '../components/InfoCard'

interface RentRejection {
  id: string
  reason: string
  message: string
  createdAt: Date
  resolved: boolean
  resolvedAt: Date | null
  rent: {
    product: {
      name: string
      address: string
    }
    user: {
      name: string | null
      email: string
    }
  }
  host: {
    name: string | null
    email: string
  }
  guest: {
    name: string | null
    email: string
  }
}

export default function RentRejectionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [rejections, setRejections] = useState<RentRejection[]>([])
  const [filteredRejections, setFilteredRejections] = useState<RentRejection[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'resolved'>('pending')

  useEffect(() => {
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  useEffect(() => {
    if (session?.user?.roles === 'ADMIN') {
      fetchRejections()
    }
  }, [session])

  const fetchRejections = async () => {
    try {
      setLoading(true)
      const data = await getAllRentRejections()
      setRejections(Array.isArray(data) ? data : data?.rejections || [])
    } catch (error) {
      console.error('Erreur lors du chargement des rejets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterRejections = useCallback(() => {
    let filtered = rejections

    // Filter by status
    if (activeFilter === 'pending') {
      filtered = filtered.filter(r => !r.resolved)
    } else if (activeFilter === 'resolved') {
      filtered = filtered.filter(r => r.resolved)
    }

    // Filter by search
    if (searchValue) {
      const searchLower = searchValue.toLowerCase()
      filtered = filtered.filter(
        r =>
          r.reason.toLowerCase().includes(searchLower) ||
          r.message.toLowerCase().includes(searchLower) ||
          r.rent.product.name.toLowerCase().includes(searchLower) ||
          r.host.name?.toLowerCase().includes(searchLower) ||
          r.guest.name?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredRejections(filtered)
  }, [rejections, activeFilter, searchValue])

  useEffect(() => {
    filterRejections()
  }, [filterRejections])

  const handleResolve = async (rejectionId: string) => {
    try {
      setResolving(rejectionId)
      if (!session?.user?.id) {
        throw new Error('Admin ID is missing')
      }
      const success = await resolveRentRejection(rejectionId, session.user.id)
      if (success) {
        await fetchRejections()
      }
    } catch (error) {
      console.error('Erreur lors de la résolution:', error)
    } finally {
      setResolving(null)
    }
  }

  const getStatistics = () => {
    const total = rejections.length
    const pending = rejections.filter(r => !r.resolved).length
    const resolved = rejections.filter(r => r.resolved).length
    const todayRejections = rejections.filter(r => {
      const today = new Date()
      const rejectionDate = new Date(r.createdAt)
      return rejectionDate.toDateString() === today.toDateString()
    }).length

    return { total, pending, resolved, todayRejections }
  }

  const stats = getStatistics()

  const quickFilters = [
    {
      label: 'En attente',
      value: 'pending',
      count: stats.pending,
      active: activeFilter === 'pending',
      onClick: () => setActiveFilter('pending'),
      variant: 'destructive' as const,
    },
    {
      label: 'Résolus',
      value: 'resolved',
      count: stats.resolved,
      active: activeFilter === 'resolved',
      onClick: () => setActiveFilter('resolved'),
      variant: 'secondary' as const,
    },
    {
      label: 'Tous',
      value: 'all',
      count: stats.total,
      active: activeFilter === 'all',
      onClick: () => setActiveFilter('all'),
      variant: 'outline' as const,
    },
  ]

  const infoCards = [
    {
      title: 'Total des rejets',
      value: stats.total,
      subtitle: 'Tous les rejets enregistrés',
      icon: XCircle,
      variant: 'default' as const,
    },
    {
      title: 'En attente',
      value: stats.pending,
      subtitle: 'Nécessitent une action',
      icon: Clock,
      variant: 'warning' as const,
    },
    {
      title: 'Résolus',
      value: stats.resolved,
      subtitle: 'Problèmes traités',
      icon: CheckCircle2,
      variant: 'success' as const,
    },
    {
      title: "Aujourd'hui",
      value: stats.todayRejections,
      subtitle: 'Nouveaux rejets du jour',
      icon: Calendar,
      variant: 'danger' as const,
    },
  ]

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50'>
        <div className='max-w-7xl mx-auto p-6'>
          <div className='animate-pulse space-y-8'>
            <div className='space-y-4'>
              <div className='h-8 bg-slate-200 rounded w-1/3'></div>
              <div className='h-4 bg-slate-200 rounded w-1/2'></div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className='bg-slate-200 rounded-lg h-24'></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50'>
      <motion.div
        className='max-w-7xl mx-auto p-6 space-y-8'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className='text-center space-y-4'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium'>
            <Shield className='h-4 w-4' />
            Gestion des Conflits
          </div>
          <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-red-700 to-orange-700'>
            Rejets de Location
          </h1>
          <p className='text-slate-600 max-w-2xl mx-auto text-lg'>
            Gérez les litiges et rejets de réservation pour maintenir la qualité du service
          </p>
        </motion.div>

        {/* Statistics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <InfoCardGrid
            cards={infoCards}
            columns={4}
            title="Vue d'ensemble"
            description='Statistiques des rejets de location'
          />
        </motion.div>

        <Separator className='bg-slate-200' />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AdminFilterBar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            quickFilters={quickFilters}
            onClearAll={() => {
              setSearchValue('')
              setActiveFilter('all')
            }}
            resultCount={filteredRejections.length}
          />
        </motion.div>

        {/* Rejections List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className='space-y-6'
        >
          {filteredRejections.length === 0 ? (
            <Card className='border-0 shadow-sm'>
              <CardContent className='p-12 text-center'>
                <div className='space-y-4'>
                  <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto'>
                    <Filter className='h-8 w-8 text-slate-400' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-slate-800'>Aucun rejet trouvé</h3>
                    <p className='text-slate-600'>
                      {activeFilter === 'pending'
                        ? 'Aucun rejet en attente de traitement'
                        : activeFilter === 'resolved'
                          ? 'Aucun rejet résolu pour le moment'
                          : 'Aucun rejet ne correspond à vos critères de recherche'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-4'>
              {filteredRejections.map((rejection, index) => (
                <motion.div
                  key={rejection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className='border-0 shadow-sm hover:shadow-md transition-all duration-300'>
                    <CardHeader>
                      <div className='flex items-start justify-between'>
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2'>
                            <CardTitle className='text-lg font-semibold text-slate-800'>
                              Rejet de réservation
                            </CardTitle>
                            <Badge
                              variant={rejection.resolved ? 'secondary' : 'destructive'}
                              className='text-xs'
                            >
                              {rejection.resolved ? 'Résolu' : 'En attente'}
                            </Badge>
                          </div>
                          <div className='flex items-center gap-4 text-sm text-slate-600'>
                            <div className='flex items-center gap-1'>
                              <Calendar className='h-4 w-4' />
                              <span>
                                {new Date(rejection.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            {rejection.resolvedAt && (
                              <div className='flex items-center gap-1'>
                                <CheckCircle2 className='h-4 w-4 text-green-600' />
                                <span>
                                  Résolu le{' '}
                                  {new Date(rejection.resolvedAt).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {!rejection.resolved && (
                          <Button
                            onClick={() => handleResolve(rejection.id)}
                            disabled={resolving === rejection.id}
                            size='sm'
                            className='bg-green-600 hover:bg-green-700'
                          >
                            {resolving === rejection.id ? (
                              <>
                                <Clock className='h-4 w-4 animate-spin mr-2' />
                                Traitement...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className='h-4 w-4 mr-2' />
                                Marquer comme résolu
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                      {/* Property Info */}
                      <div className='p-4 bg-slate-50 rounded-lg'>
                        <div className='flex items-center gap-2 mb-3'>
                          <Home className='h-4 w-4 text-slate-600' />
                          <span className='font-medium text-slate-800'>Propriété concernée</span>
                        </div>
                        <div className='space-y-2'>
                          <p className='font-semibold text-slate-800'>
                            {rejection.rent.product.name}
                          </p>
                          <div className='flex items-center gap-1 text-sm text-slate-600'>
                            <MapPin className='h-4 w-4' />
                            <span>{rejection.rent.product.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Parties involved */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='p-4 bg-blue-50 rounded-lg'>
                          <div className='flex items-center gap-2 mb-3'>
                            <User className='h-4 w-4 text-blue-600' />
                            <span className='font-medium text-blue-800'>Hôte</span>
                          </div>
                          <div className='space-y-1'>
                            <p className='font-semibold text-slate-800'>
                              {rejection.host.name || 'Nom non renseigné'}
                            </p>
                            <div className='flex items-center gap-1 text-sm text-slate-600'>
                              <Mail className='h-4 w-4' />
                              <span>{rejection.host.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className='p-4 bg-orange-50 rounded-lg'>
                          <div className='flex items-center gap-2 mb-3'>
                            <User className='h-4 w-4 text-orange-600' />
                            <span className='font-medium text-orange-800'>Invité</span>
                          </div>
                          <div className='space-y-1'>
                            <p className='font-semibold text-slate-800'>
                              {rejection.guest.name || 'Nom non renseigné'}
                            </p>
                            <div className='flex items-center gap-1 text-sm text-slate-600'>
                              <Mail className='h-4 w-4' />
                              <span>{rejection.guest.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rejection details */}
                      <div className='p-4 bg-red-50 rounded-lg border border-red-200'>
                        <div className='flex items-center gap-2 mb-3'>
                          <AlertTriangle className='h-4 w-4 text-red-600' />
                          <span className='font-medium text-red-800'>Motif du rejet</span>
                        </div>
                        <div className='space-y-3'>
                          <div>
                            <p className='text-sm text-slate-600 mb-1'>Raison:</p>
                            <p className='font-medium text-slate-800'>{rejection.reason}</p>
                          </div>
                          {rejection.message && (
                            <div>
                              <p className='text-sm text-slate-600 mb-1'>Message détaillé:</p>
                              <div className='p-3 bg-white rounded border border-red-200'>
                                <div className='flex items-start gap-2'>
                                  <MessageSquare className='h-4 w-4 text-slate-500 mt-1 flex-shrink-0' />
                                  <p className='text-slate-700 text-sm leading-relaxed'>
                                    {rejection.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
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
