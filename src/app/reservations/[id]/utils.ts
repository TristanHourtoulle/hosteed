import { PaymentStatus, RentStatus } from '@prisma/client'

export function translateRentStatus(status: RentStatus): string {
  const statusMap: Record<RentStatus, string> = {
    WAITING: 'En attente',
    RESERVED: 'Réservé',
    CHECKIN: 'Arrivée effectuée',
    CHECKOUT: 'Départ effectué',
    CANCEL: 'Annulé',
  }
  return statusMap[status]
}

export function translatePaymentStatus(status: PaymentStatus): string {
  const statusMap: Record<PaymentStatus, string> = {
    NOT_PAID: 'Non payé',
    CLIENT_PAID: 'Payé par le client',
    MID_TRANSFER_REQ: 'Demande de virement partiel',
    MID_TRANSFER_DONE: 'Virement partiel effectué',
    REST_TRANSFER_REQ: 'Demande de virement du solde',
    REST_TRANSFER_DONE: 'Virement du solde effectué',
    FULL_TRANSFER_REQ: 'Demande de virement total',
    FULL_TRANSFER_DONE: 'Virement total effectué',
    REFUNDED: 'Remboursé',
    DISPUTE: 'Litige en cours',
  }
  return statusMap[status]
}

export function getPaymentStatusColor(status: PaymentStatus): { bg: string; text: string } {
  switch (status) {
    case 'NOT_PAID':
      return { bg: 'bg-red-100', text: 'text-red-800' }
    case 'CLIENT_PAID':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' }
    case 'FULL_TRANSFER_DONE':
    case 'REST_TRANSFER_DONE':
      return { bg: 'bg-green-100', text: 'text-green-800' }
    case 'DISPUTE':
      return { bg: 'bg-red-100', text: 'text-red-800' }
    case 'REFUNDED':
      return { bg: 'bg-gray-100', text: 'text-gray-800' }
    default:
      return { bg: 'bg-blue-100', text: 'text-blue-800' }
  }
}

export function getRentStatusColor(status: RentStatus): { bg: string; text: string } {
  switch (status) {
    case 'WAITING':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' }
    case 'RESERVED':
      return { bg: 'bg-green-100', text: 'text-green-800' }
    case 'CHECKIN':
      return { bg: 'bg-blue-100', text: 'text-blue-800' }
    case 'CHECKOUT':
      return { bg: 'bg-purple-100', text: 'text-purple-800' }
    case 'CANCEL':
      return { bg: 'bg-red-100', text: 'text-red-800' }
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' }
  }
}
