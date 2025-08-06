'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { createProduct } from '@/lib/services/product.service'

export default function TestCreateProductPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!session?.user?.id) {
      setError('Vous devez être connecté')
      setIsLoading(false)
      return
    }

    try {
      console.log('🔍 Test de création de produit...')
      console.log('User ID:', session.user.id)

      const testData = {
        name: 'Test Appartement Minimal',
        description: 'Description de test pour identifier le problème',
        address: '123 Rue de Test, 75001 Paris',
        longitude: 0,
        latitude: 0,
        basePrice: '100',
        priceMGA: '400000',
        room: null,
        bathroom: null,
        arriving: 14,
        leaving: 12,
        phone: '+33123456789',
        typeId: 'cmdosmt010005itw8sdlmx9rw', // Villa
        userId: [session.user.id],
        equipments: [],
        services: [],
        meals: [],
        securities: [],
        images: [
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        ],
      }

      console.log('Données à envoyer:', testData)

      const result = await createProduct(testData)

      if (result) {
        setSuccess(`Produit créé avec succès ! ID: ${result.id}`)
        console.log('✅ Produit créé:', result.id)
      } else {
        throw new Error('Aucun résultat retourné')
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(`Erreur: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Test Création Produit</h1>
        <p>Veuillez vous connecter pour tester la création de produit.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Création Produit - Diagnostic</h1>
      <p>Utilisateur connecté: {session.user.email}</p>

      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <button
          type='submit'
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Création en cours...' : 'Créer un produit de test'}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '4px',
            color: '#d32f2f',
          }}
        >
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#e8f5e8',
            border: '1px solid #4caf50',
            borderRadius: '4px',
            color: '#2e7d32',
          }}
        >
          <strong>Succès:</strong> {success}
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>Instructions pour le debug:</h3>
        <ol>
          <li>Ouvrez la console du navigateur (F12)</li>
          <li>Cliquez sur "Créer un produit de test"</li>
          <li>Observez les logs dans la console</li>
          <li>Si une erreur apparaît, copiez-la complètement</li>
        </ol>
      </div>
    </div>
  )
}
