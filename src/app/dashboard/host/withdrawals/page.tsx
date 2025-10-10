'use client'

/**
 * Page de gestion des retraits pour les hôtes
 * Page de démonstration - À compléter selon WITHDRAWAL_SYSTEM.md
 */

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function WithdrawalsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [balance, setBalance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth')
      return
    }

    if (status === 'authenticated') {
      fetchBalance()
    }
  }, [status, router])

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/withdrawals/balance')
      if (response.ok) {
        const data = await response.json()
        setBalance(data)
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setLoading(false)
    }
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
            Gérez vos demandes de retrait et vos comptes de paiement
          </p>
        </div>

        {/* Carte de solde */}
        <div className='bg-white shadow rounded-lg p-6 mb-8'>
          <h2 className='text-xl font-semibold mb-4'>Votre solde</h2>
          {balance ? (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <p className='text-sm text-gray-600'>Total gagné</p>
                <p className='text-2xl font-bold text-gray-900'>{balance.totalEarned.toFixed(2)}€</p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>Déjà retiré</p>
                <p className='text-2xl font-bold text-gray-900'>{balance.totalWithdrawn.toFixed(2)}€</p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>Disponible</p>
                <p className='text-2xl font-bold text-green-600'>{balance.availableBalance.toFixed(2)}€</p>
              </div>
            </div>
          ) : (
            <p className='text-gray-500'>Chargement du solde...</p>
          )}
        </div>

        {/* Message informatif */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8'>
          <h3 className='text-lg font-semibold text-blue-900 mb-2'>
            🚧 Page en construction
          </h3>
          <p className='text-blue-700 mb-4'>
            Cette page affiche actuellement uniquement votre solde.
          </p>
          <div className='text-sm text-blue-600'>
            <p className='font-semibold mb-2'>Fonctionnalités à venir :</p>
            <ul className='list-disc list-inside space-y-1'>
              <li>Voir vos demandes de retrait</li>
              <li>Créer une nouvelle demande de retrait</li>
              <li>Gérer vos comptes de paiement (SEPA, Pripeo, Mobile Money, PayPal, MoneyGram)</li>
              <li>Historique des paiements</li>
            </ul>
          </div>
        </div>

        {/* Données de test créées */}
        <div className='bg-green-50 border border-green-200 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-green-900 mb-2'>
            ✅ Données de test créées
          </h3>
          <p className='text-green-700 mb-4'>
            Le script de seed a créé les données suivantes dans votre base de données :
          </p>
          <ul className='list-disc list-inside space-y-1 text-sm text-green-600'>
            <li>3 comptes de paiement (SEPA validé, Mobile Money non validé, PayPal validé)</li>
            <li>4 demandes de retrait avec différents statuts :
              <ul className='list-circle list-inside ml-6 mt-1'>
                <li>PENDING - 100€</li>
                <li>APPROVED - 200€</li>
                <li>PAID - 150€</li>
                <li>ACCOUNT_VALIDATION - 75€</li>
              </ul>
            </li>
          </ul>
          <p className='text-sm text-green-600 mt-4'>
            📚 Consultez <code className='bg-green-100 px-2 py-1 rounded'>WITHDRAWAL_SYSTEM.md</code> pour voir le code complet à implémenter.
          </p>
        </div>

        {/* Instructions pour continuer */}
        <div className='mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-yellow-900 mb-2'>
            📖 Pour continuer le développement
          </h3>
          <div className='text-sm text-yellow-700 space-y-2'>
            <p>1. Lisez <code className='bg-yellow-100 px-2 py-1 rounded'>WITHDRAWAL_SYSTEM.md</code> pour la documentation complète</p>
            <p>2. Créez les routes API manquantes (exemples fournis dans la doc)</p>
            <p>3. Implémentez l'interface complète avec :</p>
            <ul className='list-disc list-inside ml-4 mt-1'>
              <li>Tableau des demandes de retrait</li>
              <li>Formulaire de création de demande</li>
              <li>Gestion des comptes de paiement</li>
            </ul>
            <p>4. Testez le workflow complet</p>
          </div>
        </div>
      </div>
    </div>
  )
}
