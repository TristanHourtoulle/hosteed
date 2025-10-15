'use client'

/**
 * Page de gestion des retraits pour les hôtes
 * Permet de créer des demandes de retrait avec différents moyens de paiement
 */

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/shadcnui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'
import { toast } from 'sonner'
import { PaymentMethod, WithdrawalStatus } from '@prisma/client'
import {
  Wallet,
  CreditCard,
  Building2,
  Smartphone,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react'

type WithdrawalRequest = {
  id: string
  amount: number
  withdrawalType: 'PARTIAL_50' | 'FULL_100'
  status: WithdrawalStatus
  paymentMethod: PaymentMethod
  createdAt: string
  paymentAccount?: {
    accountHolderName: string
    isValidated: boolean
  }
}

type BalanceData = {
  totalEarned: number
  totalWithdrawn: number
  availableBalance: number
  amount50Percent: number
  amount100Percent: number
}

type PaymentFormData = {
  // Commun
  accountHolderName: string
  // SEPA
  iban: string
  // Pripeo
  cardNumber: string
  cardEmail: string
  // Mobile Money
  mobileNumber: string
  // PayPal
  paypalUsername: string
  paypalEmail: string
  paypalPhone: string
  paypalIban: string
  // MoneyGram
  moneygramFullName: string
  moneygramPhone: string
}

export default function WithdrawalsPage() {
  const { session, isLoading: isAuthLoading, isAuthenticated } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()

  // States
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [withdrawalType, setWithdrawalType] = useState<'PARTIAL_50' | 'FULL_100'>('PARTIAL_50')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('SEPA_VIREMENT')
  const [savePaymentMethod, setSavePaymentMethod] = useState(false)
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    accountHolderName: '',
    iban: '',
    cardNumber: '',
    cardEmail: '',
    mobileNumber: '',
    paypalUsername: '',
    paypalEmail: '',
    paypalPhone: '',
    paypalIban: '',
    moneygramFullName: '',
    moneygramPhone: '',
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance()
      fetchRequests()
    }
  }, [isAuthenticated])

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/withdrawals/balance', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (response.ok) {
        const data = await response.json()
        setBalance(data)
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
      toast.error('Erreur lors du chargement du solde')
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/withdrawals/requests', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!balance) return

    const amount = withdrawalType === 'PARTIAL_50'
      ? balance.amount50Percent
      : balance.amount100Percent

    if (amount <= 0) {
      toast.error('Montant insuffisant')
      return
    }

    // Validation des champs selon le moyen de paiement
    const errors: string[] = []

    if (paymentMethod === 'SEPA_VIREMENT') {
      if (!paymentForm.accountHolderName) errors.push('Nom du titulaire')
      if (!paymentForm.iban) errors.push('IBAN')
    } else if (paymentMethod === 'PRIPEO') {
      if (!paymentForm.accountHolderName) errors.push('Nom du titulaire')
      if (!paymentForm.cardNumber) errors.push('Numéro de carte')
      if (!paymentForm.cardEmail) errors.push('Adresse email')
    } else if (paymentMethod === 'MOBILE_MONEY') {
      if (!paymentForm.accountHolderName) errors.push('Nom associé au compte')
      if (!paymentForm.mobileNumber) errors.push('Numéro de téléphone')
    } else if (paymentMethod === 'PAYPAL') {
      if (!paymentForm.paypalUsername) errors.push('Nom d\'utilisateur PayPal')
      if (!paymentForm.paypalEmail) errors.push('Email PayPal')
      if (!paymentForm.paypalPhone) errors.push('Téléphone PayPal')
      if (!paymentForm.paypalIban) errors.push('IBAN PayPal')
    } else if (paymentMethod === 'MONEYGRAM') {
      if (!paymentForm.moneygramFullName) errors.push('Nom complet')
      if (!paymentForm.moneygramPhone) errors.push('Numéro de téléphone')
    }

    if (errors.length > 0) {
      toast.error(`Champs manquants: ${errors.join(', ')}`)
      return
    }

    setSubmitting(true)

    try {
      const requestBody = {
        amount,
        withdrawalType,
        paymentMethod,
        savePaymentMethod,
        paymentDetails: buildPaymentDetails(),
      }

      const response = await fetch('/api/withdrawals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Demande de retrait créée avec succès')
        setShowModal(false)
        resetForm()
        fetchBalance()
        fetchRequests()
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating withdrawal:', error)
      toast.error('Erreur lors de la création de la demande')
    } finally {
      setSubmitting(false)
    }
  }

  const buildPaymentDetails = () => {
    const details: Record<string, string> = {}

    if (paymentMethod === 'SEPA_VIREMENT') {
      details.accountHolderName = paymentForm.accountHolderName
      details.iban = paymentForm.iban
    } else if (paymentMethod === 'PRIPEO') {
      details.accountHolderName = paymentForm.accountHolderName
      details.cardNumber = paymentForm.cardNumber
      details.cardEmail = paymentForm.cardEmail
    } else if (paymentMethod === 'MOBILE_MONEY') {
      details.accountHolderName = paymentForm.accountHolderName
      details.mobileNumber = paymentForm.mobileNumber
    } else if (paymentMethod === 'PAYPAL') {
      details.paypalUsername = paymentForm.paypalUsername
      details.paypalEmail = paymentForm.paypalEmail
      details.paypalPhone = paymentForm.paypalPhone
      details.paypalIban = paymentForm.paypalIban
    } else if (paymentMethod === 'MONEYGRAM') {
      details.moneygramFullName = paymentForm.moneygramFullName
      details.moneygramPhone = paymentForm.moneygramPhone
    }

    return details
  }

  const resetForm = () => {
    setPaymentForm({
      accountHolderName: '',
      iban: '',
      cardNumber: '',
      cardEmail: '',
      mobileNumber: '',
      paypalUsername: '',
      paypalEmail: '',
      paypalPhone: '',
      paypalIban: '',
      moneygramFullName: '',
      moneygramPhone: '',
    })
    setSavePaymentMethod(false)
  }

  const getStatusIcon = (status: WithdrawalStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'ACCOUNT_VALIDATION':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'APPROVED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'PAID':
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: WithdrawalStatus) => {
    const labels: Record<WithdrawalStatus, string> = {
      PENDING: 'En attente',
      ACCOUNT_VALIDATION: 'Validation du compte',
      APPROVED: 'Approuvée',
      PAID: 'Payée',
      REJECTED: 'Refusée',
      CANCELLED: 'Annulée',
    }
    return labels[status]
  }

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      SEPA_VIREMENT: 'Virement SEPA',
      PRIPEO: 'Pripeo',
      MOBILE_MONEY: 'Mobile Money',
      PAYPAL: 'PayPal',
      MONEYGRAM: 'MoneyGram',
      TAPTAP: 'TapTap',
      INTERNATIONAL: 'International',
      OTHER: 'Autre',
    }
    return labels[method]
  }

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const selectedAmount = balance
    ? (withdrawalType === 'PARTIAL_50' ? balance.amount50Percent : balance.amount100Percent)
    : 0

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* En-tête */}
        <div className='mb-8 flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Gestion des retraits</h1>
            <p className='mt-2 text-sm text-gray-600'>
              Gérez vos demandes de retrait et suivez leur statut
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            disabled={!balance || balance.availableBalance <= 0}
            className='flex items-center gap-2'
          >
            <Plus className='h-4 w-4' />
            Demander un retrait
          </Button>
        </div>

        {/* Carte de solde */}
        <div className='bg-white shadow rounded-lg p-6 mb-8'>
          <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
            <Wallet className='h-5 w-5' />
            Votre solde
          </h2>
          {balance ? (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='bg-blue-50 rounded-lg p-4'>
                <p className='text-sm text-blue-600 font-medium mb-1'>Total gagné</p>
                <p className='text-3xl font-bold text-blue-900'>{balance.totalEarned.toFixed(2)}€</p>
              </div>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-sm text-gray-600 font-medium mb-1'>Déjà retiré</p>
                <p className='text-3xl font-bold text-gray-900'>{balance.totalWithdrawn.toFixed(2)}€</p>
              </div>
              <div className='bg-green-50 rounded-lg p-4'>
                <p className='text-sm text-green-600 font-medium mb-1'>Disponible</p>
                <p className='text-3xl font-bold text-green-900'>{balance.availableBalance.toFixed(2)}€</p>
                <div className='mt-2 text-xs text-gray-500 space-y-1'>
                  <p>• 50% maintenant: {balance.amount50Percent.toFixed(2)}€</p>
                  <p>• 100% (J+3): {balance.amount100Percent.toFixed(2)}€</p>
                </div>
              </div>
            </div>
          ) : (
            <p className='text-gray-500'>Chargement du solde...</p>
          )}
        </div>

        {/* Liste des demandes */}
        <Tabs defaultValue='all' className='w-full'>
          <TabsList>
            <TabsTrigger value='all'>Toutes</TabsTrigger>
            <TabsTrigger value='pending'>En attente</TabsTrigger>
            <TabsTrigger value='approved'>Approuvées</TabsTrigger>
            <TabsTrigger value='paid'>Payées</TabsTrigger>
          </TabsList>

          <TabsContent value='all' className='mt-6'>
            <Card>
              <CardHeader>
                <CardTitle>Mes demandes de retrait</CardTitle>
                <CardDescription>Historique de toutes vos demandes</CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <p className='text-center text-gray-500 py-8'>Aucune demande de retrait</p>
                ) : (
                  <div className='space-y-4'>
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50'
                      >
                        <div className='flex items-center gap-4'>
                          {getStatusIcon(request.status)}
                          <div>
                            <p className='font-semibold text-gray-900'>
                              {request.amount.toFixed(2)}€
                            </p>
                            <p className='text-sm text-gray-500'>
                              {getPaymentMethodLabel(request.paymentMethod)}
                              {request.paymentAccount && ` - ${request.paymentAccount.accountHolderName}`}
                            </p>
                            <p className='text-xs text-gray-400'>
                              {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <Badge variant={request.status === 'PAID' ? 'default' : 'secondary'}>
                            {getStatusLabel(request.status)}
                          </Badge>
                          <Badge variant='outline'>
                            {request.withdrawalType === 'PARTIAL_50' ? '50%' : '100%'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='pending'>
            <Card>
              <CardHeader>
                <CardTitle>Demandes en attente</CardTitle>
              </CardHeader>
              <CardContent>
                {requests.filter((r) => r.status === 'PENDING' || r.status === 'ACCOUNT_VALIDATION').length === 0 ? (
                  <p className='text-center text-gray-500 py-8'>Aucune demande en attente</p>
                ) : (
                  <div className='space-y-4'>
                    {requests.filter((r) => r.status === 'PENDING' || r.status === 'ACCOUNT_VALIDATION').map((request) => (
                      <div key={request.id} className='flex items-center justify-between p-4 border rounded-lg'>
                        <div className='flex items-center gap-4'>
                          {getStatusIcon(request.status)}
                          <div>
                            <p className='font-semibold'>{request.amount.toFixed(2)}€</p>
                            <p className='text-sm text-gray-500'>{getPaymentMethodLabel(request.paymentMethod)}</p>
                          </div>
                        </div>
                        <Badge>{getStatusLabel(request.status)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='approved'>
            <Card>
              <CardHeader>
                <CardTitle>Demandes approuvées</CardTitle>
              </CardHeader>
              <CardContent>
                {requests.filter((r) => r.status === 'APPROVED').length === 0 ? (
                  <p className='text-center text-gray-500 py-8'>Aucune demande approuvée</p>
                ) : (
                  <div className='space-y-4'>
                    {requests.filter((r) => r.status === 'APPROVED').map((request) => (
                      <div key={request.id} className='flex items-center justify-between p-4 border rounded-lg'>
                        <div className='flex items-center gap-4'>
                          {getStatusIcon(request.status)}
                          <div>
                            <p className='font-semibold'>{request.amount.toFixed(2)}€</p>
                            <p className='text-sm text-gray-500'>{getPaymentMethodLabel(request.paymentMethod)}</p>
                          </div>
                        </div>
                        <Badge variant='default'>{getStatusLabel(request.status)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='paid'>
            <Card>
              <CardHeader>
                <CardTitle>Retraits effectués</CardTitle>
              </CardHeader>
              <CardContent>
                {requests.filter((r) => r.status === 'PAID').length === 0 ? (
                  <p className='text-center text-gray-500 py-8'>Aucun retrait effectué</p>
                ) : (
                  <div className='space-y-4'>
                    {requests.filter((r) => r.status === 'PAID').map((request) => (
                      <div key={request.id} className='flex items-center justify-between p-4 border rounded-lg'>
                        <div className='flex items-center gap-4'>
                          {getStatusIcon(request.status)}
                          <div>
                            <p className='font-semibold'>{request.amount.toFixed(2)}€</p>
                            <p className='text-sm text-gray-500'>{getPaymentMethodLabel(request.paymentMethod)}</p>
                          </div>
                        </div>
                        <Badge variant='default'>{getStatusLabel(request.status)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de création de demande */}
        {showModal && (
          <div className='fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
              <div className='p-6'>
                <h2 className='text-2xl font-bold mb-6'>Nouvelle demande de retrait</h2>

                <form onSubmit={handleSubmit} className='space-y-6'>
                  {/* Choix du montant */}
                  <div>
                    <Label className='text-base font-semibold mb-3 block'>
                      Montant à retirer
                    </Label>
                    <div className='grid grid-cols-2 gap-4'>
                      <button
                        type='button'
                        onClick={() => setWithdrawalType('PARTIAL_50')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          withdrawalType === 'PARTIAL_50'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className='font-semibold text-gray-900'>50% maintenant</p>
                        <p className='text-2xl font-bold text-blue-600 mt-1'>
                          {balance?.amount50Percent.toFixed(2)}€
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>Disponible immédiatement</p>
                      </button>
                      <button
                        type='button'
                        onClick={() => setWithdrawalType('FULL_100')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          withdrawalType === 'FULL_100'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className='font-semibold text-gray-900'>100% (J+3)</p>
                        <p className='text-2xl font-bold text-blue-600 mt-1'>
                          {balance?.amount100Percent.toFixed(2)}€
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>Après 3 jours ouvrés</p>
                      </button>
                    </div>
                  </div>

                  {/* Choix du moyen de paiement */}
                  <div>
                    <Label className='text-base font-semibold mb-3 block'>
                      Moyen de paiement
                    </Label>
                    <div className='grid grid-cols-1 gap-2'>
                      {[
                        { value: 'SEPA_VIREMENT', label: 'Virement SEPA', icon: Building2, desc: 'Réservé aux comptes bancaires en euros' },
                        { value: 'PRIPEO', label: 'Pripeo', icon: CreditCard, desc: 'Carte VISA prépayée (frais: 1,50€)' },
                        { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone, desc: 'Transfert mobile' },
                        { value: 'PAYPAL', label: 'PayPal', icon: Wallet, desc: 'Frais de transfert possibles' },
                        { value: 'MONEYGRAM', label: 'MoneyGram', icon: DollarSign, desc: 'Transfert international' },
                      ].map((method) => (
                        <button
                          key={method.value}
                          type='button'
                          onClick={() => setPaymentMethod(method.value as PaymentMethod)}
                          className={`flex items-center gap-3 p-3 border-2 rounded-lg text-left transition-all ${
                            paymentMethod === method.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <method.icon className='h-5 w-5 text-gray-600' />
                          <div className='flex-1'>
                            <p className='font-semibold text-gray-900'>{method.label}</p>
                            <p className='text-xs text-gray-500'>{method.desc}</p>
                          </div>
                          {paymentMethod === method.value && (
                            <CheckCircle2 className='h-5 w-5 text-blue-500' />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Champs spécifiques selon le moyen de paiement */}
                  <div className='space-y-4 border-t pt-4'>
                    <h3 className='font-semibold text-gray-900'>
                      Informations de paiement
                    </h3>

                    {/* SEPA VIREMENT */}
                    {paymentMethod === 'SEPA_VIREMENT' && (
                      <>
                        <div>
                          <Label htmlFor='accountHolderName'>Nom du titulaire du compte *</Label>
                          <Input
                            id='accountHolderName'
                            value={paymentForm.accountHolderName}
                            onChange={(e) => setPaymentForm({ ...paymentForm, accountHolderName: e.target.value })}
                            placeholder='Jean Dupont'
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor='iban'>IBAN *</Label>
                          <Input
                            id='iban'
                            value={paymentForm.iban}
                            onChange={(e) => setPaymentForm({ ...paymentForm, iban: e.target.value })}
                            placeholder='FR76 1234 5678 9012 3456 7890 123'
                            required
                          />
                        </div>
                      </>
                    )}

                    {/* PRIPEO */}
                    {paymentMethod === 'PRIPEO' && (
                      <>
                        <div>
                          <Label htmlFor='accountHolderName'>Nom du titulaire *</Label>
                          <Input
                            id='accountHolderName'
                            value={paymentForm.accountHolderName}
                            onChange={(e) => setPaymentForm({ ...paymentForm, accountHolderName: e.target.value })}
                            placeholder='Jean Dupont'
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor='cardNumber'>Numéro de carte *</Label>
                          <Input
                            id='cardNumber'
                            value={paymentForm.cardNumber}
                            onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                            placeholder='1234 5678 9012 3456'
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor='cardEmail'>Adresse email reliée au compte *</Label>
                          <Input
                            id='cardEmail'
                            type='email'
                            value={paymentForm.cardEmail}
                            onChange={(e) => setPaymentForm({ ...paymentForm, cardEmail: e.target.value })}
                            placeholder='jean@example.com'
                            required
                          />
                        </div>
                        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                          <p className='text-sm text-yellow-800'>
                            ⚠️ Frais de 1,50€ appliqués pour chaque transaction Pripeo
                          </p>
                        </div>
                      </>
                    )}

                    {/* MOBILE MONEY */}
                    {paymentMethod === 'MOBILE_MONEY' && (
                      <>
                        <div>
                          <Label htmlFor='accountHolderName'>Nom associé au compte *</Label>
                          <Input
                            id='accountHolderName'
                            value={paymentForm.accountHolderName}
                            onChange={(e) => setPaymentForm({ ...paymentForm, accountHolderName: e.target.value })}
                            placeholder='Jean Dupont'
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor='mobileNumber'>Numéro (Format: +261 XX XX XX XXXX XX) *</Label>
                          <Input
                            id='mobileNumber'
                            value={paymentForm.mobileNumber}
                            onChange={(e) => setPaymentForm({ ...paymentForm, mobileNumber: e.target.value })}
                            placeholder='+261 34 12 345 67'
                            required
                          />
                        </div>
                      </>
                    )}

                    {/* PAYPAL */}
                    {paymentMethod === 'PAYPAL' && (
                      <>
                        <div>
                          <Label htmlFor='paypalUsername'>Nom d&apos;utilisateur *</Label>
                          <Input
                            id='paypalUsername'
                            value={paymentForm.paypalUsername}
                            onChange={(e) => setPaymentForm({ ...paymentForm, paypalUsername: e.target.value })}
                            placeholder='jeandupont'
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor='paypalEmail'>Adresse e-mail *</Label>
                          <Input
                            id='paypalEmail'
                            type='email'
                            value={paymentForm.paypalEmail}
                            onChange={(e) => setPaymentForm({ ...paymentForm, paypalEmail: e.target.value })}
                            placeholder='jean@example.com'
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor='paypalPhone'>Numéro de téléphone (format avec code Pays) *</Label>
                          <Input
                            id='paypalPhone'
                            value={paymentForm.paypalPhone}
                            onChange={(e) => setPaymentForm({ ...paymentForm, paypalPhone: e.target.value })}
                            placeholder='+33 6 12 34 56 78'
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor='paypalIban'>IBAN *</Label>
                          <Input
                            id='paypalIban'
                            value={paymentForm.paypalIban}
                            onChange={(e) => setPaymentForm({ ...paymentForm, paypalIban: e.target.value })}
                            placeholder='FR76 1234 5678 9012 3456 7890 123'
                            required
                          />
                        </div>
                        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                          <p className='text-sm text-yellow-800'>
                            ℹ️ Des frais de transfert peuvent s&apos;appliquer
                          </p>
                        </div>
                      </>
                    )}

                    {/* MONEYGRAM */}
                    {paymentMethod === 'MONEYGRAM' && (
                      <>
                        <div>
                          <Label htmlFor='moneygramFullName'>Nom complet *</Label>
                          <Input
                            id='moneygramFullName'
                            value={paymentForm.moneygramFullName}
                            onChange={(e) => setPaymentForm({ ...paymentForm, moneygramFullName: e.target.value })}
                            placeholder='Jean Dupont'
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor='moneygramPhone'>Numéro de téléphone (Format: +261 XX XX XXX XX) *</Label>
                          <Input
                            id='moneygramPhone'
                            value={paymentForm.moneygramPhone}
                            onChange={(e) => setPaymentForm({ ...paymentForm, moneygramPhone: e.target.value })}
                            placeholder='+261 34 12 345 67'
                            required
                          />
                        </div>
                      </>
                    )}

                    {/* Checkbox pour sauvegarder */}
                    <div className='flex items-center gap-2 pt-4 border-t'>
                      <input
                        type='checkbox'
                        id='savePaymentMethod'
                        checked={savePaymentMethod}
                        onChange={(e) => setSavePaymentMethod(e.target.checked)}
                        className='h-4 w-4 text-blue-600 rounded border-gray-300'
                      />
                      <Label htmlFor='savePaymentMethod' className='text-sm cursor-pointer'>
                        Enregistrer ce moyen de paiement pour les prochaines demandes
                      </Label>
                    </div>
                  </div>

                  {/* Résumé */}
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <h4 className='font-semibold text-blue-900 mb-2'>Résumé de votre demande</h4>
                    <div className='space-y-1 text-sm text-blue-800'>
                      <p>• Montant: <span className='font-bold'>{selectedAmount.toFixed(2)}€</span></p>
                      <p>• Type: <span className='font-bold'>{withdrawalType === 'PARTIAL_50' ? '50% immédiat' : '100% (J+3)'}</span></p>
                      <p>• Moyen: <span className='font-bold'>{getPaymentMethodLabel(paymentMethod)}</span></p>
                    </div>
                  </div>

                  {/* Boutons */}
                  <div className='flex gap-3 pt-4'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        setShowModal(false)
                        resetForm()
                      }}
                      className='flex-1'
                      disabled={submitting}
                    >
                      Annuler
                    </Button>
                    <Button
                      type='submit'
                      className='flex-1'
                      disabled={submitting || selectedAmount <= 0}
                    >
                      {submitting ? 'Création...' : `Demander ${selectedAmount.toFixed(2)}€`}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
