'use client'

/**
 * Page Admin - Gestion des retraits
 * /admin/withdrawals
 *
 * Permet aux admin/host_manager de :
 * - Voir toutes les demandes de retrait
 * - Approuver/rejeter des demandes
 * - Marquer comme payé
 * - Valider des comptes de paiement
 * - Créer des demandes pour les hôtes
 */

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  WithdrawalStatus,
  PaymentMethod,
  type WithdrawalRequest as PrismaWithdrawalRequest,
  type PaymentAccount
} from '@prisma/client'

// Type étendu avec les relations
type WithdrawalRequest = PrismaWithdrawalRequest & {
  user: {
    id: string
    name: string | null
    email: string
  }
  paymentAccount: PaymentAccount | null
  processor: {
    id: string
    name: string | null
    email: string
  } | null
}

type Host = {
  id: string
  name: string | null
  email: string
  roles: string
  createdAt: Date
}

export default function AdminWithdrawalsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<WithdrawalStatus | 'ALL'>('ALL')
  const [selectedHost, setSelectedHost] = useState<string>('')
  const [hostBalance, setHostBalance] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form state for withdrawal creation
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    withdrawalType: 'PARTIAL_50' as 'PARTIAL_50' | 'FULL_100',
    paymentMethod: 'SEPA_VIREMENT' as PaymentMethod,
    notes: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth')
      return
    }

    if (status === 'authenticated') {
      // Vérifier les permissions
      if (!session.user.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
        toast.error('Accès non autorisé')
        router.push('/dashboard')
        return
      }

      fetchRequests()
      fetchHosts()
    }
  }, [status, router, session])

  const fetchRequests = async () => {
    try {
      const url = filter === 'ALL'
        ? '/api/admin/withdrawals'
        : `/api/admin/withdrawals?status=${filter}`

      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  const fetchHosts = async () => {
    try {
      const response = await fetch('/api/admin/hosts', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setHosts(data.hosts)
      }
    } catch (error) {
      console.error('Error fetching hosts:', error)
    }
  }

  const fetchHostBalance = async (hostId: string) => {
    try {
      const response = await fetch(`/api/admin/withdrawals/balance/${hostId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setHostBalance(data)
      }
    } catch (error) {
      console.error('Error fetching host balance:', error)
      toast.error('Erreur lors du chargement du solde')
    }
  }

  const handleApprove = async (requestId: string) => {
    if (!confirm('Approuver cette demande de retrait ?')) return

    try {
      const response = await fetch(`/api/admin/withdrawals/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: 'Approuvé' })
      })

      if (response.ok) {
        toast.success('Demande approuvée')
        fetchRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'approbation')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'approbation')
    }
  }

  const handleReject = async (requestId: string) => {
    const reason = prompt('Raison du refus :')
    if (!reason) return

    try {
      const response = await fetch(`/api/admin/withdrawals/${requestId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason })
      })

      if (response.ok) {
        toast.success('Demande rejetée')
        fetchRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors du refus')
      }
    } catch (error) {
      toast.error('Erreur lors du refus')
    }
  }

  const handleMarkPaid = async (requestId: string) => {
    if (!confirm('Marquer cette demande comme payée ?')) return

    try {
      const response = await fetch(`/api/admin/withdrawals/${requestId}/mark-paid`, {
        method: 'PUT'
      })

      if (response.ok) {
        toast.success('Demande marquée comme payée')
        fetchRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const handleValidateAccount = async (accountId: string) => {
    if (!confirm('Valider ce compte de paiement ?')) return

    try {
      const response = await fetch(`/api/admin/withdrawals/payment-accounts/${accountId}/validate`, {
        method: 'PUT'
      })

      if (response.ok) {
        toast.success('Compte validé')
        fetchRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const handleCreateWithdrawal = async () => {
    if (!selectedHost) {
      toast.error('Veuillez sélectionner un hôte')
      return
    }

    if (!withdrawalForm.amount || parseFloat(withdrawalForm.amount) <= 0) {
      toast.error('Veuillez saisir un montant valide')
      return
    }

    if (parseFloat(withdrawalForm.amount) > hostBalance.availableBalance) {
      toast.error('Le montant dépasse le solde disponible')
      return
    }

    try {
      const response = await fetch('/api/admin/withdrawals/create-for-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: selectedHost,
          amount: parseFloat(withdrawalForm.amount),
          withdrawalType: withdrawalForm.withdrawalType,
          paymentMethod: withdrawalForm.paymentMethod,
          notes: withdrawalForm.notes || `Demande créée par ${session?.user?.name || 'admin'}`,
        }),
      })

      if (response.ok) {
        toast.success('Demande de retrait créée avec succès')
        setShowCreateModal(false)
        setWithdrawalForm({
          amount: '',
          withdrawalType: 'PARTIAL_50',
          paymentMethod: 'SEPA_VIREMENT',
          notes: '',
        })
        fetchRequests()
        fetchHostBalance(selectedHost)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création')
      }
    } catch (error) {
      toast.error('Erreur lors de la création')
    }
  }

  useEffect(() => {
    if (filter !== 'ALL') {
      fetchRequests()
    }
  }, [filter])

  useEffect(() => {
    if (selectedHost) {
      fetchHostBalance(selectedHost)
    } else {
      setHostBalance(null)
    }
  }, [selectedHost])

  const getStatusBadge = (status: WithdrawalStatus) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCOUNT_VALIDATION: 'bg-orange-100 text-orange-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }

    const labels = {
      PENDING: 'En attente',
      ACCOUNT_VALIDATION: 'Validation compte',
      APPROVED: 'Approuvée',
      PAID: 'Payée',
      REJECTED: 'Rejetée',
      CANCELLED: 'Annulée',
    }

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels = {
      SEPA_VIREMENT: 'SEPA',
      PRIPEO: 'Pripeo',
      MOBILE_MONEY: 'Mobile Money',
      PAYPAL: 'PayPal',
      MONEYGRAM: 'MoneyGram',
      TAPTAP: 'TapTap',
      INTERNATIONAL: 'International',
      OTHER: 'Autre',
    }
    return labels[method] || method
  }

  if (loading || status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* En-tête */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Gestion des retraits</h1>
          <p className='mt-2 text-sm text-gray-600'>
            Gérer les demandes de retrait pour tous les hôtes
          </p>
        </div>

        {/* Sélecteur d'hôte et création de demande */}
        <div className='bg-white shadow rounded-lg p-6 mb-8'>
          <h2 className='text-lg font-semibold mb-4'>Créer une demande pour un hôte</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Sélectionner un hôte
              </label>
              <select
                value={selectedHost}
                onChange={(e) => setSelectedHost(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
              >
                <option value=''>-- Choisir un hôte --</option>
                {hosts.map(host => (
                  <option key={host.id} value={host.id}>
                    {host.name || host.email} ({host.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedHost && hostBalance && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <p className='text-sm font-medium text-blue-900 mb-2'>Solde de l'hôte</p>
                <div className='grid grid-cols-3 gap-2 text-sm'>
                  <div>
                    <p className='text-blue-600'>Total gagné</p>
                    <p className='font-bold text-blue-900'>{hostBalance.totalEarned.toFixed(2)}€</p>
                  </div>
                  <div>
                    <p className='text-blue-600'>Retiré</p>
                    <p className='font-bold text-blue-900'>{hostBalance.totalWithdrawn.toFixed(2)}€</p>
                  </div>
                  <div>
                    <p className='text-blue-600'>Disponible</p>
                    <p className='font-bold text-green-600'>{hostBalance.availableBalance.toFixed(2)}€</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedHost && hostBalance && (
            <div className='mt-4'>
              <button
                onClick={() => setShowCreateModal(true)}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
              >
                Créer une demande de retrait pour cet hôte
              </button>
            </div>
          )}
        </div>

        {/* Filtres */}
        <div className='bg-white shadow rounded-lg p-4 mb-6'>
          <div className='flex gap-2 overflow-x-auto'>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes ({requests.length})
            </button>
            <button
              onClick={() => setFilter(WithdrawalStatus.PENDING)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === WithdrawalStatus.PENDING
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setFilter(WithdrawalStatus.ACCOUNT_VALIDATION)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === WithdrawalStatus.ACCOUNT_VALIDATION
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Validation compte
            </button>
            <button
              onClick={() => setFilter(WithdrawalStatus.APPROVED)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === WithdrawalStatus.APPROVED
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approuvées
            </button>
            <button
              onClick={() => setFilter(WithdrawalStatus.PAID)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === WithdrawalStatus.PAID
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Payées
            </button>
          </div>
        </div>

        {/* Liste des demandes */}
        <div className='bg-white shadow rounded-lg overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Hôte</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Montant</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Méthode</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Statut</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Date</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Actions</th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='px-6 py-8 text-center text-gray-500'>
                      Aucune demande trouvée
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4'>
                        <div>
                          <p className='text-sm font-medium text-gray-900'>{request.user.name}</p>
                          <p className='text-sm text-gray-500'>{request.user.email}</p>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <p className='text-sm font-bold text-gray-900'>{request.amount.toFixed(2)}€</p>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div>
                          <p className='text-sm text-gray-900'>{getPaymentMethodLabel(request.paymentMethod)}</p>
                          {!request.paymentAccount?.isValidated && (
                            <p className='text-xs text-orange-600'>Non validé</p>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {getStatusBadge(request.status)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm'>
                        <div className='flex gap-2'>
                          {request.status === WithdrawalStatus.ACCOUNT_VALIDATION && request.paymentAccount && (
                            <button
                              onClick={() => handleValidateAccount(request.paymentAccount!.id)}
                              className='text-orange-600 hover:text-orange-900'
                            >
                              Valider compte
                            </button>
                          )}
                          {request.status === WithdrawalStatus.PENDING && (
                            <>
                              <button
                                onClick={() => handleApprove(request.id)}
                                className='text-green-600 hover:text-green-900'
                              >
                                Approuver
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                className='text-red-600 hover:text-red-900'
                              >
                                Rejeter
                              </button>
                            </>
                          )}
                          {request.status === WithdrawalStatus.APPROVED && (
                            <button
                              onClick={() => handleMarkPaid(request.id)}
                              className='text-blue-600 hover:text-blue-900'
                            >
                              Marquer payé
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de création de demande */}
        {showCreateModal && (
          <div className='fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
              <div className='p-6'>
                <div className='flex justify-between items-center mb-6'>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    Créer une demande de retrait
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>

                {/* Informations hôte */}
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
                  <p className='text-sm font-medium text-blue-900 mb-2'>
                    Hôte : {hosts.find(h => h.id === selectedHost)?.name || hosts.find(h => h.id === selectedHost)?.email}
                  </p>
                  {hostBalance && (
                    <div className='grid grid-cols-3 gap-4 text-sm'>
                      <div>
                        <p className='text-blue-600'>Total gagné</p>
                        <p className='font-bold text-blue-900'>{hostBalance.totalEarned.toFixed(2)}€</p>
                      </div>
                      <div>
                        <p className='text-blue-600'>Déjà retiré</p>
                        <p className='font-bold text-blue-900'>{hostBalance.totalWithdrawn.toFixed(2)}€</p>
                      </div>
                      <div>
                        <p className='text-green-600'>Disponible</p>
                        <p className='font-bold text-green-900'>{hostBalance.availableBalance.toFixed(2)}€</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Formulaire */}
                <div className='space-y-4'>
                  {/* Montant */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Montant à retirer (€) *
                    </label>
                    <input
                      type='number'
                      step='0.01'
                      min='0'
                      max={hostBalance?.availableBalance || 0}
                      value={withdrawalForm.amount}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      placeholder='0.00'
                    />
                    {hostBalance && (
                      <p className='text-xs text-gray-500 mt-1'>
                        Maximum disponible : {hostBalance.availableBalance.toFixed(2)}€
                      </p>
                    )}
                  </div>

                  {/* Type de retrait */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Type de retrait *
                    </label>
                    <select
                      value={withdrawalForm.withdrawalType}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, withdrawalType: e.target.value as 'PARTIAL_50' | 'FULL_100' })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    >
                      <option value='PARTIAL_50'>Partiel 50% (selon contrat)</option>
                      <option value='FULL_100'>Complet 100%</option>
                    </select>
                  </div>

                  {/* Méthode de paiement */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Méthode de paiement *
                    </label>
                    <select
                      value={withdrawalForm.paymentMethod}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, paymentMethod: e.target.value as PaymentMethod })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    >
                      <option value='SEPA_VIREMENT'>SEPA</option>
                      <option value='PRIPEO'>Pripeo (+1.50€)</option>
                      <option value='MOBILE_MONEY'>Mobile Money</option>
                      <option value='PAYPAL'>PayPal</option>
                      <option value='MONEYGRAM'>MoneyGram</option>
                    </select>
                    <p className='text-xs text-gray-500 mt-1'>
                      Note : Le compte de paiement de l'hôte sera utilisé s'il existe, sinon un nouveau sera créé.
                    </p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={withdrawalForm.notes}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, notes: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      rows={3}
                      placeholder='Notes additionnelles...'
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className='flex justify-end gap-3 mt-6'>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateWithdrawal}
                    className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
                  >
                    Créer la demande
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
