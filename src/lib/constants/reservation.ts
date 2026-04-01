import {
  Clock,
  CheckCircle,
  LogIn,
  LogOut,
  Ban,
  CreditCard,
} from 'lucide-react'
import { PaymentStatus, PaymentMethod } from '@prisma/client'

/* ------------------------------------------------------------------ */
/*  Status                                                            */
/* ------------------------------------------------------------------ */

export interface StatusConfig {
  label: string
  color: string
  bg: string
  icon: React.ComponentType<{ className?: string }>
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  WAITING: { label: 'En attente', color: 'text-yellow-800', bg: 'bg-yellow-100', icon: Clock },
  RESERVED: { label: 'Confirmée', color: 'text-blue-800', bg: 'bg-blue-100', icon: CheckCircle },
  CHECKIN: { label: 'Check-in', color: 'text-green-800', bg: 'bg-green-100', icon: LogIn },
  CHECKOUT: { label: 'Check-out', color: 'text-gray-800', bg: 'bg-gray-100', icon: LogOut },
  CANCEL: { label: 'Annulée', color: 'text-red-800', bg: 'bg-red-100', icon: Ban },
}

export const STATUS_TIMELINE = [
  { key: 'WAITING', label: 'En attente', icon: Clock },
  { key: 'RESERVED', label: 'Confirmée', icon: CheckCircle },
  { key: 'CHECKIN', label: 'Check-in', icon: LogIn },
  { key: 'CHECKOUT', label: 'Check-out', icon: LogOut },
] as const

export const STATUS_ORDER: Record<string, number> = {
  WAITING: 0,
  RESERVED: 1,
  CHECKIN: 2,
  CHECKOUT: 3,
  CANCEL: -1,
}

/* ------------------------------------------------------------------ */
/*  Payment                                                           */
/* ------------------------------------------------------------------ */

export const PAYMENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NOT_PAID: { label: 'Non payé', color: 'text-gray-700', bg: 'bg-gray-100' },
  AUTHORIZED: { label: 'Autorisé', color: 'text-amber-700', bg: 'bg-amber-100' },
  CLIENT_PAID: { label: 'Payé', color: 'text-green-700', bg: 'bg-green-100' },
  MID_TRANSFER_REQ: { label: 'Transfert partiel demandé', color: 'text-orange-700', bg: 'bg-orange-100' },
  MID_TRANSFER_DONE: { label: 'Transfert partiel effectué', color: 'text-blue-700', bg: 'bg-blue-100' },
  REST_TRANSFER_REQ: { label: 'Transfert final demandé', color: 'text-orange-700', bg: 'bg-orange-100' },
  REST_TRANSFER_DONE: { label: 'Transfert final effectué', color: 'text-blue-700', bg: 'bg-blue-100' },
  FULL_TRANSFER_REQ: { label: 'Transfert total demandé', color: 'text-orange-700', bg: 'bg-orange-100' },
  FULL_TRANSFER_DONE: { label: 'Transfert total effectué', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  REFUNDED: { label: 'Remboursé', color: 'text-purple-700', bg: 'bg-purple-100' },
  DISPUTE: { label: 'Litige', color: 'text-red-700', bg: 'bg-red-100' },
}

export const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  NOT_PAID: { label: 'Non payé', color: 'text-gray-600' },
  CLIENT_PAID: { label: 'Payé par le client', color: 'text-green-600' },
  MID_TRANSFER_REQ: { label: 'Transfert partiel demandé', color: 'text-orange-600' },
  MID_TRANSFER_DONE: { label: 'Transfert partiel effectué', color: 'text-blue-600' },
  REST_TRANSFER_REQ: { label: 'Transfert final demandé', color: 'text-orange-600' },
  REST_TRANSFER_DONE: { label: 'Transfert final effectué', color: 'text-blue-600' },
  FULL_TRANSFER_REQ: { label: 'Transfert total demandé', color: 'text-orange-600' },
  FULL_TRANSFER_DONE: { label: 'Transfert total effectué', color: 'text-emerald-600' },
  REFUNDED: { label: 'Remboursé', color: 'text-purple-600' },
  DISPUTE: { label: 'Litige', color: 'text-red-600' },
}

/* ------------------------------------------------------------------ */
/*  Admin action configs                                              */
/* ------------------------------------------------------------------ */

export interface ActionConfig {
  newStatus: 'RESERVED' | 'CHECKIN' | 'CHECKOUT'
  label: string
  description: string
  consequence: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  hoverColor: string
}

export const ACTIONS_BY_STATUS: Record<string, ActionConfig[]> = {
  WAITING: [
    {
      newStatus: 'RESERVED',
      label: 'Approuver et capturer le paiement',
      description: 'Confirme la réservation auprès du voyageur.',
      consequence: 'Le montant sera débité de la carte du client via Stripe.',
      icon: CreditCard,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
    },
  ],
  RESERVED: [
    {
      newStatus: 'CHECKIN',
      label: 'Enregistrer le check-in',
      description: "Le voyageur est arrivé sur le lieu d'hébergement.",
      consequence: 'Le séjour est officiellement en cours.',
      icon: LogIn,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
    },
  ],
  CHECKIN: [
    {
      newStatus: 'CHECKOUT',
      label: 'Enregistrer le check-out',
      description: "Le voyageur a quitté le lieu d'hébergement.",
      consequence: "Le séjour est terminé. Les fonds seront libérés vers l'hôte.",
      icon: LogOut,
      color: 'bg-gray-600',
      hoverColor: 'hover:bg-gray-700',
    },
  ],
}

/* ------------------------------------------------------------------ */
/*  Transfer configs                                                  */
/* ------------------------------------------------------------------ */

export interface TransferConfig {
  type: PaymentStatus
  label: string
  description: string
  consequence: string
  color: string
  hoverColor: string
  amount: (hostAmount: number) => number
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'SEPA_VIREMENT', label: 'Virement SEPA' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'MONEYGRAM', label: 'MoneyGram' },
  { value: 'PRIPEO', label: 'Pripeo' },
]

/**
 * Returns available transfer options based on current payment status, reservation status, and contract presence
 */
export function getAvailableTransfers(
  payment: string,
  status: string,
  hasContract: boolean
): TransferConfig[] {
  const transfers: TransferConfig[] = []

  if (
    payment === PaymentStatus.CLIENT_PAID &&
    (status === 'RESERVED' || status === 'CHECKIN' || status === 'CHECKOUT' || hasContract)
  ) {
    transfers.push({
      type: PaymentStatus.MID_TRANSFER_REQ,
      label: 'Verser 50% à l\u2019hôte',
      description: 'Déclenche un versement de la moitié du montant dû à l\u2019hôte.',
      consequence: 'L\u2019hôte recevra 50% du montant (hors commission) via la méthode choisie.',
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      amount: (h: number) => h / 2,
    })
    transfers.push({
      type: PaymentStatus.FULL_TRANSFER_REQ,
      label: 'Verser 100% à l\u2019hôte',
      description: 'Déclenche un versement intégral du montant dû à l\u2019hôte.',
      consequence: 'L\u2019hôte recevra la totalité du montant (hors commission) via la méthode choisie.',
      color: 'bg-emerald-600',
      hoverColor: 'hover:bg-emerald-700',
      amount: (h: number) => h,
    })
  }

  if (payment === PaymentStatus.MID_TRANSFER_DONE) {
    transfers.push({
      type: PaymentStatus.REST_TRANSFER_REQ,
      label: 'Verser le solde restant à l\u2019hôte',
      description: 'Déclenche le versement du solde restant (50%) à l\u2019hôte.',
      consequence: 'L\u2019hôte recevra le reste du montant dû via la méthode choisie.',
      color: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
      amount: (h: number) => h / 2,
    })
  }

  return transfers
}
