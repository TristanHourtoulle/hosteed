'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAllPaymentRequest } from '@/lib/services/payment.service'
import { PaymentStatus, PaymentMethod, PaymentReqStatus } from '@prisma/client'

interface PayRequest {
  id: string
  userId: string
  PaymentRequest: PaymentStatus
  prices: string
  notes: string
  method: PaymentMethod
  status: PaymentReqStatus
  user: {
    name: string | null
    email: string
  }
  rent: {
    product: {
      name: string
    }
  }
}

export default function PaymentAdminPage() {
  const router = useRouter()
  const [payRequests, setPayRequests] = useState<PayRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<PayRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<PaymentReqStatus | 'ALL'>('ALL')

  useEffect(() => {
    fetchPayRequests()
  }, [])

  useEffect(() => {
    // Filtrer les demandes selon le statut sélectionné
    if (statusFilter === 'ALL') {
      setFilteredRequests(payRequests)
    } else {
      setFilteredRequests(payRequests.filter(req => req.status === statusFilter))
    }
  }, [payRequests, statusFilter])

  const fetchPayRequests = async () => {
    try {
      console.log('Fetching payment requests...')
      const result = await getAllPaymentRequest()
      console.log('Payment requests result:', result)
      setPayRequests(result.payRequest)
    } catch (error) {
      console.error('Erreur lors du chargement des demandes de paiement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (requestId: string) => {
    router.push(`/admin/payment/${requestId}`)
  }

  const getPaymentRequestLabel = (type: PaymentStatus) => {
    const labels: Partial<Record<PaymentStatus, string>> = {
      FULL_TRANSFER_REQ: 'Paiement intégral',
      MID_TRANSFER_REQ: 'Paiement de 50%',
      REST_TRANSFER_REQ: 'Solde restant',
    }
    return labels[type] || type
  }

  const getStatusBadge = (type: PaymentStatus) => {
    switch (type) {
      case PaymentStatus.FULL_TRANSFER_REQ:
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            💰 {getPaymentRequestLabel(type)}
          </span>
        )
      case PaymentStatus.MID_TRANSFER_REQ:
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
            📊 {getPaymentRequestLabel(type)}
          </span>
        )
      case PaymentStatus.REST_TRANSFER_REQ:
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800'>
            💳 {getPaymentRequestLabel(type)}
          </span>
        )
      default:
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
            {getPaymentRequestLabel(type)}
          </span>
        )
    }
  }

  const getRequestStatusBadge = (status: PaymentReqStatus) => {
    switch (status) {
      case PaymentReqStatus.RECEIVED:
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
            ⏳ Reçu
          </span>
        )
      case PaymentReqStatus.DONE:
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            ✅ Terminé
          </span>
        )
      case PaymentReqStatus.REFUSED:
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
            ❌ Refusé
          </span>
        )
      default:
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
            {status}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
        <div className='flex items-center justify-center min-h-[calc(100vh-4rem)]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Chargement des demandes de paiement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>🏦 Gestion des Paiements</h1>
          <p className='text-gray-600'>
            Gérez les demandes de paiement des hôtes et effectuez les actions nécessaires
          </p>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-200'>
            <div className='flex items-center'>
              <div className='text-2xl mr-4'>📋</div>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total</p>
                <p className='text-2xl font-bold text-gray-900'>{payRequests.length}</p>
              </div>
            </div>
          </div>
          <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-200'>
            <div className='flex items-center'>
              <div className='text-2xl mr-4'>⏰</div>
              <div>
                <p className='text-sm font-medium text-gray-600'>En attente</p>
                <p className='text-2xl font-bold text-orange-600'>
                  {payRequests.filter(req => req.status === PaymentReqStatus.RECEIVED).length}
                </p>
              </div>
            </div>
          </div>
          <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-200'>
            <div className='flex items-center'>
              <div className='text-2xl mr-4'>✅</div>
              <div>
                <p className='text-sm font-medium text-gray-600'>Terminé</p>
                <p className='text-2xl font-bold text-green-600'>
                  {payRequests.filter(req => req.status === PaymentReqStatus.DONE).length}
                </p>
              </div>
            </div>
          </div>
          <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-200'>
            <div className='flex items-center'>
              <div className='text-2xl mr-4'>❌</div>
              <div>
                <p className='text-sm font-medium text-gray-600'>Refusé</p>
                <p className='text-2xl font-bold text-red-600'>
                  {payRequests.filter(req => req.status === PaymentReqStatus.REFUSED).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className='mb-6 flex flex-wrap items-center gap-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-gray-700'>Filtrer par statut:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as PaymentReqStatus | 'ALL')}
              className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
            >
              <option value='ALL'>Tous ({payRequests.length})</option>
              <option value={PaymentReqStatus.RECEIVED}>
                En attente (
                {payRequests.filter(req => req.status === PaymentReqStatus.RECEIVED).length})
              </option>
              <option value={PaymentReqStatus.DONE}>
                Terminé ({payRequests.filter(req => req.status === PaymentReqStatus.DONE).length})
              </option>
              <option value={PaymentReqStatus.REFUSED}>
                Refusé ({payRequests.filter(req => req.status === PaymentReqStatus.REFUSED).length})
              </option>
            </select>
          </div>
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <span>💰 Montant total visible:</span>
            <span className='font-semibold text-gray-900'>
              {filteredRequests
                .reduce((sum, req) => sum + Number(req.prices), 0)
                .toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        </div>

        {/* Debug info */}
        <div className='mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
          <p className='text-sm text-blue-800'>
            🔍 Debug: {filteredRequests.length} demande(s) affichée(s) sur {payRequests.length} au
            total
          </p>
        </div>

        {/* Requests Table */}
        <div className='bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200'>
          {filteredRequests.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-6xl mb-4'>📭</div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                {statusFilter === 'ALL'
                  ? 'Aucune demande de paiement'
                  : `Aucune demande ${
                      statusFilter === PaymentReqStatus.RECEIVED
                        ? 'en attente'
                        : statusFilter === PaymentReqStatus.DONE
                          ? 'terminée'
                          : 'refusée'
                    }`}
              </h3>
              <p className='text-gray-600'>
                {statusFilter === 'ALL'
                  ? 'Aucune demande de paiement n&apos;a encore été créée.'
                  : 'Changez le filtre pour voir d&apos;autres demandes.'}
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Type & Montant
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Hôte
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Date demande
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredRequests.map(request => (
                    <tr key={request.id} className='hover:bg-gray-50 transition-colors'>
                      <td className='px-6 py-4'>
                        <div className='flex flex-col space-y-2'>
                          {getStatusBadge(request.PaymentRequest)}
                          <div className='text-lg font-semibold text-gray-900'>
                            {Number(request.prices).toLocaleString('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>{getRequestStatusBadge(request.status)}</td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center'>
                          <div className='text-lg mr-2'>👤</div>
                          <div>
                            <div className='text-sm font-medium text-gray-900'>
                              {request.user.name || 'Sans nom'}
                            </div>
                            <div className='text-sm text-gray-500'>{request.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center'>
                          <div className='text-lg mr-2'>📅</div>
                          <div className='text-sm text-gray-900'>Non disponible</div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <button
                          onClick={() => handleViewDetails(request.id)}
                          className='px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2'
                        >
                          <span>👁️</span>
                          <span>Voir détails</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
