'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getPaymentRequestById,
  approvePaymentRequest,
  rejectPaymentRequest,
  requestPaymentInfo,
} from '@/lib/services/payment.service'
import { PaymentStatus, PaymentMethod, PaymentReqStatus } from '@prisma/client'

interface PayRequestDetails {
  id: string
  userId: string
  PaymentRequest: PaymentStatus
  prices: string
  notes: string
  method: PaymentMethod
  status: PaymentReqStatus
  createdAt: string
  updatedAt: string
  user: {
    name: string | null
    email: string
  }
  rent: {
    id: string
    product: {
      name: string
      address: string
    }
    checkIn: string
    checkOut: string
    totalPrice: number
  }
  // Historique des actions (à implémenter dans le service)
  history?: Array<{
    id: string
    action: string
    note: string
    createdAt: string
    adminUser?: {
      name: string | null
      email: string
    }
  }>
}

type ActionType = 'approve' | 'reject' | 'request_info'

export default function PaymentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [payRequest, setPayRequest] = useState<PayRequestDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState<ActionType>('approve')
  const [actionNote, setActionNote] = useState('')

  const fetchPayRequestDetails = useCallback(async () => {
    try {
      setLoading(true)
      // Pour l'instant, on utilise getAllPaymentRequest et on filtre
      // TODO: Créer une fonction getPaymentRequestById dans le service
      const result = await getPaymentRequestById(resolvedParams.id)
      setPayRequest(result)
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id])

  useEffect(() => {
    fetchPayRequestDetails()
  }, [fetchPayRequestDetails])

  const openModal = (action: ActionType) => {
    setActionType(action)
    setActionNote('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setActionNote('')
  }

  const handleAction = async () => {
    if (!payRequest) return

    try {
      setUpdating(true)

      if (actionType === 'approve') {
        await approvePaymentRequest(payRequest.id)
      } else if (actionType === 'reject') {
        if (!actionNote.trim()) {
          alert('Veuillez fournir une raison pour le refus')
          return
        }
        await rejectPaymentRequest(payRequest.id, actionNote)
      } else if (actionType === 'request_info') {
        if (!actionNote.trim()) {
          alert('Veuillez spécifier quelles informations sont nécessaires')
          return
        }
        await requestPaymentInfo(payRequest.id, actionNote)
      }

      await fetchPayRequestDetails()
      closeModal()
    } catch (error) {
      console.error("Erreur lors de l'action:", error)
      alert("Une erreur s'est produite lors du traitement de la demande")
    } finally {
      setUpdating(false)
    }
  }

  const goBack = () => {
    router.push('/admin/payment')
  }

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      SEPA_VIREMENT: 'Virement SEPA',
      PRIPEO: 'Pripeo',
      MOBILE_MONEY: 'Mobile Money',
      PAYPAL: 'PayPal',
      MONEYGRAM: 'MoneyGram',
      TAPTAP: 'Taptap',
      INTERNATIONAL: 'Virement International',
      OTHER: 'Autre',
    }
    return labels[method] || method
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
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800'>
            💰 {getPaymentRequestLabel(type)}
          </span>
        )
      case PaymentStatus.MID_TRANSFER_REQ:
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
            📊 {getPaymentRequestLabel(type)}
          </span>
        )
      case PaymentStatus.REST_TRANSFER_REQ:
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800'>
            💳 {getPaymentRequestLabel(type)}
          </span>
        )
      default:
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800'>
            {getPaymentRequestLabel(type)}
          </span>
        )
    }
  }

  const getRequestStatusBadge = (status: PaymentReqStatus) => {
    switch (status) {
      case PaymentReqStatus.RECEIVED:
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800'>
            ⏳ Reçu
          </span>
        )
      case PaymentReqStatus.DONE:
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800'>
            ✅ Terminé
          </span>
        )
      case PaymentReqStatus.REFUSED:
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800'>
            ❌ Refusé
          </span>
        )
      default:
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800'>
            {status}
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
        <div className='flex items-center justify-center min-h-[calc(100vh-4rem)]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Chargement des détails de la demande...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!payRequest) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
        <div className='max-w-4xl mx-auto'>
          <div className='bg-white rounded-xl shadow-sm p-8 text-center'>
            <div className='text-6xl mb-4'>❌</div>
            <h2 className='text-xl font-bold text-gray-900 mb-2'>Demande introuvable</h2>
            <p className='text-gray-600 mt-1'>
              Cette réservation n&apos;existe pas ou a été supprimée.
            </p>
            <button
              onClick={goBack}
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <button
              onClick={goBack}
              className='p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-200'
            >
              <svg
                className='w-5 h-5 text-gray-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M10 19l-7-7m0 0l7-7m-7 7h18'
                />
              </svg>
            </button>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Détails de la demande de paiement
              </h1>
              <p className='text-gray-600 mt-1'>
                Demande #{payRequest.id.slice(0, 8)}... • Date non disponible
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3'>{getRequestStatusBadge(payRequest.status)}</div>
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Informations principales */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Détails de la demande */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-semibold text-gray-900'>Informations de la demande</h2>
              </div>
              <div className='p-6 space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Type de paiement</label>
                    <div className='mt-1'>{getStatusBadge(payRequest.PaymentRequest)}</div>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Montant</label>
                    <div className='mt-1 text-2xl font-bold text-green-600'>
                      {Number(payRequest.prices).toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Méthode de paiement</label>
                    <div className='mt-1 text-gray-900'>
                      {getPaymentMethodLabel(payRequest.method)}
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Statut</label>
                    <div className='mt-1'>{getRequestStatusBadge(payRequest.status)}</div>
                  </div>
                </div>
                {payRequest.notes && (
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Notes de l&apos;hôte
                    </label>
                    <div className='mt-1 p-3 bg-gray-50 rounded-lg border'>
                      <p className='text-gray-900'>{payRequest.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informations de l'hôte */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
              <div className='bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-semibold text-gray-900'>Informations de l&apos;hôte</h2>
              </div>
              <div className='p-6'>
                <div className='flex items-start gap-4'>
                  <div className='bg-blue-100 p-3 rounded-lg'>
                    <svg
                      className='w-6 h-6 text-blue-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                      />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {payRequest.user.name || 'Sans nom'}
                    </h3>
                    <p className='text-gray-600'>{payRequest.user.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations de la réservation */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
              <div className='bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-semibold text-gray-900'>Détails de la réservation</h2>
              </div>
              <div className='p-6'>
                <div className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Propriété</label>
                    <div className='mt-1 text-gray-900 font-medium'>
                      {payRequest.rent.product.name}
                    </div>
                    <div className='text-sm text-gray-600'>{payRequest.rent.product.address}</div>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div>
                      <label className='text-sm font-medium text-gray-500'>Check-in</label>
                      <div className='mt-1 text-gray-900'>
                        {new Date(payRequest.rent.checkIn).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div>
                      <label className='text-sm font-medium text-gray-500'>Check-out</label>
                      <div className='mt-1 text-gray-900'>
                        {new Date(payRequest.rent.checkOut).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div>
                      <label className='text-sm font-medium text-gray-500'>Prix total</label>
                      <div className='mt-1 text-gray-900 font-semibold'>
                        {payRequest.rent.totalPrice.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Historique des actions */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
              <div className='bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-semibold text-gray-900'>
                  Historique des modifications
                </h2>
              </div>
              <div className='p-6'>
                {payRequest.history && payRequest.history.length > 0 ? (
                  <div className='space-y-4'>
                    {payRequest.history.map(entry => (
                      <div
                        key={entry.id}
                        className='flex gap-4 pb-4 border-b border-gray-100 last:border-b-0'
                      >
                        <div className='bg-blue-100 p-2 rounded-lg h-fit'>
                          <svg
                            className='w-4 h-4 text-blue-600'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                            />
                          </svg>
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-center justify-between'>
                            <h4 className='font-medium text-gray-900'>{entry.action}</h4>
                            <span className='text-sm text-gray-500'>
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                          {entry.note && <p className='text-gray-600 mt-1'>{entry.note}</p>}
                          {entry.adminUser && (
                            <p className='text-sm text-gray-500 mt-1'>
                              Par: {entry.adminUser.name || entry.adminUser.email}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8 text-gray-500'>
                    <svg
                      className='w-12 h-12 mx-auto mb-3 text-gray-300'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    <p>Aucun historique de modifications disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions sidebar */}
          <div className='space-y-6'>
            {/* Actions rapides */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
              <div className='bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-semibold text-gray-900'>Actions</h2>
              </div>
              <div className='p-6 space-y-3'>
                {payRequest.status === PaymentReqStatus.RECEIVED && (
                  <>
                    <button
                      onClick={() => openModal('approve')}
                      disabled={updating}
                      className='w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                    >
                      <span>✅</span>
                      <span>Approuver la demande</span>
                    </button>
                    <button
                      onClick={() => openModal('reject')}
                      disabled={updating}
                      className='w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                    >
                      <span>❌</span>
                      <span>Refuser la demande</span>
                    </button>
                    <button
                      onClick={() => openModal('request_info')}
                      disabled={updating}
                      className='w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                    >
                      <span>ℹ️</span>
                      <span>Demander des infos</span>
                    </button>
                  </>
                )}
                {payRequest.status === PaymentReqStatus.DONE && (
                  <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
                    <div className='flex items-center gap-2 text-green-800'>
                      <span>✅</span>
                      <span className='font-medium'>Demande approuvée</span>
                    </div>
                    <p className='text-sm text-green-700 mt-1'>
                      Cette demande de paiement a été approuvée et traitée.
                    </p>
                  </div>
                )}
                {payRequest.status === PaymentReqStatus.REFUSED && (
                  <div className='p-4 bg-red-50 rounded-lg border border-red-200'>
                    <div className='flex items-center gap-2 text-red-800'>
                      <span>❌</span>
                      <span className='font-medium'>Demande refusée</span>
                    </div>
                    <p className='text-sm text-red-700 mt-1'>
                      Cette demande de paiement a été refusée.
                    </p>
                  </div>
                )}
                <button
                  onClick={goBack}
                  className='w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2'
                >
                  <span>↩️</span>
                  <span>Retour à la liste</span>
                </button>
              </div>
            </div>

            {/* Résumé */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
              <div className='bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-semibold text-gray-900'>Résumé</h2>
              </div>
              <div className='p-6 space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Créé le:</span>
                  <span className='font-medium text-gray-900'>Non disponible</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Modifié le:</span>
                  <span className='font-medium text-gray-900'>Non disponible</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>ID demande:</span>
                  <span className='font-mono text-sm text-gray-900'>
                    {payRequest.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal pour les actions */}
        {showModal && (
          <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100 overflow-hidden transform transition-all'>
              {/* Header */}
              <div
                className={`p-6 ${
                  actionType === 'approve'
                    ? 'bg-gradient-to-r from-green-600 to-green-700'
                    : actionType === 'reject'
                      ? 'bg-gradient-to-r from-red-600 to-red-700'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700'
                }`}
              >
                <div className='flex items-center gap-3'>
                  <div className='bg-white/20 p-3 rounded-xl'>
                    <span className='text-2xl'>
                      {actionType === 'reject' && '❌'}
                      {actionType === 'request_info' && 'ℹ️'}
                      {actionType === 'approve' && '✅'}
                    </span>
                  </div>
                  <div>
                    <h3 className='text-xl font-bold text-white'>
                      {actionType === 'reject' && 'Refuser la demande'}
                      {actionType === 'request_info' && 'Demander des informations'}
                      {actionType === 'approve' && 'Approuver la demande'}
                    </h3>
                    <p className='text-white/80 text-sm mt-1'>Action sur la demande de paiement</p>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className='p-6'>
                {/* Champ de saisie pour les actions nécessitant une note */}
                {(actionType === 'reject' || actionType === 'request_info') && (
                  <div className='mb-6'>
                    <label className='block text-sm font-semibold text-gray-700 mb-3'>
                      {actionType === 'reject' ? 'Raison du refus:' : 'Informations demandées:'}
                    </label>
                    <textarea
                      value={actionNote}
                      onChange={e => setActionNote(e.target.value)}
                      className='w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none bg-gray-50 focus:bg-white'
                      rows={4}
                      placeholder={
                        actionType === 'reject'
                          ? 'Expliquez clairement pourquoi cette demande est refusée...'
                          : 'Spécifiez quelles informations supplémentaires sont nécessaires...'
                      }
                    />
                  </div>
                )}

                {/* Alerte d'information */}
                <div
                  className={`mb-6 p-4 rounded-xl border-l-4 ${
                    actionType === 'approve'
                      ? 'bg-green-50 border-green-400'
                      : actionType === 'reject'
                        ? 'bg-red-50 border-red-400'
                        : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      actionType === 'approve'
                        ? 'text-green-700'
                        : actionType === 'reject'
                          ? 'text-red-700'
                          : 'text-blue-700'
                    }`}
                  >
                    {actionType === 'approve' &&
                      'Le paiement sera approuvé et l&apos;utilisateur sera notifié par email.'}
                    {actionType === 'reject' &&
                      'Cette action ne peut pas être annulée. L&apos;utilisateur sera notifié par email.'}
                    {actionType === 'request_info' &&
                      'L&apos;utilisateur recevra un email avec votre demande d&apos;informations supplémentaires.'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className='bg-gray-50 px-6 py-4 flex justify-end space-x-3'>
                <button
                  onClick={closeModal}
                  className='px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200 border border-gray-200'
                >
                  Annuler
                </button>
                <button
                  onClick={handleAction}
                  disabled={updating}
                  className={`px-6 py-2.5 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl ${
                    actionType === 'approve'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                      : actionType === 'reject'
                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  }`}
                >
                  {updating ? (
                    <>
                      <svg
                        className='w-4 h-4 animate-spin'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                        />
                      </svg>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <span>
                        {actionType === 'approve' && '✅'}
                        {actionType === 'reject' && '❌'}
                        {actionType === 'request_info' && '📤'}
                      </span>
                      {actionType === 'approve'
                        ? 'Approuver'
                        : actionType === 'reject'
                          ? 'Refuser'
                          : 'Envoyer la demande'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
