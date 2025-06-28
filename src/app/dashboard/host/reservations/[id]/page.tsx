// TODO: refactor this file because it's larger than 200 lines
'use client'

import { useEffect, useState, use } from 'react'
import { useSession } from 'next-auth/react'
import {
  getRentById,
  changeRentStatus,
  approveRent,
  RentWithDates,
} from '@/lib/services/rents.service'
import { getPayablePricesPerRent, createPayRequest } from '@/lib/services/payment.service'
import { RentStatus, PaymentStatus, PaymentMethod } from '@prisma/client'
import HostNavbar from '../../components/HostNavbar'
interface PayablePrices {
  totalPricesPayable: number
  availablePrice: number
  pendingPrice: number
  commission: number
}

export default function RentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const [rent, setRent] = useState<RentWithDates | null>(null)
  const [prices, setPrices] = useState<PayablePrices | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [paymentType, setPaymentType] = useState<PaymentStatus | null>(null)
  const [notes, setNotes] = useState('')
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.SEPA_VIREMENT)
  const resolvedParams = use(params)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (session?.user?.id) {
          const [rentData, pricesData] = await Promise.all([
            getRentById(resolvedParams.id),
            getPayablePricesPerRent(resolvedParams.id),
          ])
          if (rentData) {
            setRent(rentData)
          }
          if (pricesData) {
            setPrices(pricesData)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchData()
    }
  }, [session, resolvedParams.id])

  const handleStatusChange = async (newStatus: RentStatus) => {
    try {
      setUpdating(true)
      await changeRentStatus(resolvedParams.id, newStatus)
      // Rafraîchir les données
      const updatedRent = await getRentById(resolvedParams.id)
      if (updatedRent) {
        setRent(updatedRent)
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleApproveReservation = async () => {
    try {
      setUpdating(true)
      if (!rent?.stripeId) {
        throw new Error('Aucun paiement associé à cette réservation')
      }
      const result = await approveRent(resolvedParams.id)
      if (!result) {
        throw new Error("Erreur lors de l'approbation de la réservation")
      }
      if (result.success) {
        const updatedRent = await getRentById(resolvedParams.id)
        if (updatedRent) {
          setRent(updatedRent)
        }
      } else {
        throw new Error("Erreur lors de l'approbation de la réservation")
      }
    } catch (error) {
      console.error("Erreur lors de l'approbation de la réservation:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentRequest = async (type: PaymentStatus) => {
    setPaymentType(type)
    setShowModal(true)
  }

  const handleSubmitPaymentRequest = async () => {
    if (!paymentType || !session?.user?.id) return

    try {
      setUpdating(true)
      await createPayRequest(resolvedParams.id, paymentType, session.user.id, notes, method)
      // Rafraîchir les données
      const [rentData, pricesData] = await Promise.all([
        getRentById(resolvedParams.id),
        getPayablePricesPerRent(resolvedParams.id),
      ])
      if (rentData) {
        setRent(rentData)
      }
      if (pricesData) {
        setPrices(pricesData)
      }
      setShowModal(false)
      setNotes('')
      setMethod(PaymentMethod.SEPA_VIREMENT)
      setPaymentType(null)
    } catch (error) {
      console.error('Erreur lors de la demande de paiement:', error)
    } finally {
      setUpdating(false)
    }
  }

  const renderModal = () => {
    if (!showModal) return null

    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
        <div className='bg-white rounded-lg p-6 w-full max-w-md'>
          <h2 className='text-xl font-bold mb-4'>Demande de paiement</h2>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Méthode de paiement
              </label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value as PaymentMethod)}
                className='w-full p-2 border border-gray-300 rounded-md'
              >
                <option value={PaymentMethod.SEPA_VIREMENT}>Virement SEPA</option>
                <option value={PaymentMethod.TAPTAP}>Taptap</option>
                <option value={PaymentMethod.PAYPAL}>PayPal</option>
                <option value={PaymentMethod.INTERNATIONAL}>Virement International</option>
                <option value={PaymentMethod.OTHER}>Autre</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className='w-full p-2 border border-gray-300 rounded-md'
                rows={3}
                placeholder='Ajoutez des notes pour cette demande de paiement...'
              />
            </div>
            <div className='flex justify-end space-x-3 mt-6'>
              <button
                onClick={() => {
                  setShowModal(false)
                  setNotes('')
                  setMethod(PaymentMethod.SEPA_VIREMENT)
                  setPaymentType(null)
                }}
                className='px-4 py-2 text-gray-600 hover:text-gray-800'
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitPaymentRequest}
                disabled={updating}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
              >
                {updating ? 'Envoi...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: RentStatus) => {
    const statusConfig = {
      RESERVED: { label: 'Réservée', color: 'bg-yellow-100 text-yellow-800' },
      WAITING: { label: 'En attente', color: 'bg-orange-100 text-orange-800' },
      CHECKIN: { label: 'En cours', color: 'bg-green-100 text-green-800' },
      CHECKOUT: { label: 'Terminée', color: 'bg-gray-100 text-gray-800' },
      CANCEL: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
    }

    const config = statusConfig[status] || { label: 'Inconnu', color: 'bg-gray-100 text-gray-800' }
    return <span className={`px-2 py-1 rounded-full text-sm ${config.color}`}>{config.label}</span>
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-100'>
        <HostNavbar />
        <div className='flex items-center justify-center min-h-[calc(100vh-4rem)]'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      </div>
    )
  }

  if (!rent) {
    return (
      <div className='min-h-screen bg-gray-100'>
        <HostNavbar />
        <div className='container mx-auto py-6'>
          <div className='bg-white rounded-lg shadow-md p-6'>
            <p className='text-gray-500'>Location non trouvée</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      <HostNavbar />
      {renderModal()}
      <div className='container mx-auto py-6'>
        <div className='bg-white rounded-lg shadow-md'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex justify-between items-center'>
              <h1 className='text-2xl font-bold text-gray-900'>Détails de la location</h1>
              <div className='flex items-center gap-4'>
                {rent.status === RentStatus.RESERVED && (
                  <>
                    <button
                      onClick={handleApproveReservation}
                      disabled={updating}
                      className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50'
                    >
                      {updating ? 'Mise à jour...' : 'Approuver la réservation'}
                    </button>
                    <button
                      onClick={() => handleStatusChange(RentStatus.CHECKIN)}
                      disabled={updating}
                      className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50'
                    >
                      {updating ? 'Mise à jour...' : 'Marquer comme arrivé'}
                    </button>
                  </>
                )}
                {rent.status === RentStatus.CHECKIN && (
                  <button
                    onClick={() => handleStatusChange(RentStatus.CHECKOUT)}
                    disabled={updating}
                    className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
                  >
                    {updating ? 'Mise à jour...' : 'Marquer comme terminé'}
                  </button>
                )}
                {rent.status === RentStatus.CHECKIN &&
                  rent.payment === PaymentStatus.CLIENT_PAID && (
                    <button
                      onClick={() => handlePaymentRequest(PaymentStatus.MID_TRANSFER_REQ)}
                      disabled={updating}
                      className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
                    >
                      {updating ? 'Mise à jour...' : 'Demander le paiement de 50%'}
                    </button>
                  )}
                {rent.status === RentStatus.CHECKOUT &&
                  rent.payment === PaymentStatus.MID_TRANSFER_DONE && (
                    <button
                      onClick={() => handlePaymentRequest(PaymentStatus.REST_TRANSFER_REQ)}
                      disabled={updating}
                      className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
                    >
                      {updating ? 'Mise à jour...' : 'Demander le reste du paiement'}
                    </button>
                  )}
                {getStatusBadge(rent.status)}
              </div>
            </div>
          </div>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                  Informations de la location
                </h2>
                <div className='space-y-4'>
                  <div>
                    <p className='text-sm text-gray-500'>Produit</p>
                    <p className='text-gray-900'>{rent.product?.name || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Client</p>
                    <p className='text-gray-900'>
                      {rent.product?.user?.[0]?.name || 'Non spécifié'}
                    </p>
                    <p className='text-sm text-gray-500'>
                      {rent.product?.user?.[0]?.email || 'Non spécifié'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Date d&apos;arrivée</p>
                    <p className='text-gray-900'>
                      {rent.arrivingDate ? formatDate(rent.arrivingDate) : 'Non spécifiée'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Date de départ</p>
                    <p className='text-gray-900'>
                      {rent.leavingDate ? formatDate(rent.leavingDate) : 'Non spécifiée'}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                  Informations de paiement
                </h2>
                <div className='space-y-4'>
                  <div>
                    <p className='text-sm text-gray-500'>Prix total (sans commission)</p>
                    <p className='text-gray-900'>
                      {prices?.totalPricesPayable.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Prix disponible</p>
                    <p className='text-gray-900'>
                      {prices?.availablePrice.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Prix en attente</p>
                    <p className='text-gray-900'>
                      {prices?.pendingPrice.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Commission</p>
                    <p className='text-gray-900'>{prices?.commission}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
