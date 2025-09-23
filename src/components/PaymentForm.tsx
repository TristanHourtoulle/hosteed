'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useStripe, useElements } from '@stripe/react-stripe-js'
import { LazyStripeElements, LazyPaymentElement } from '@/components/dynamic/LazyComponents'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  amount: number
  onSuccess?: (stripeTransactionId: string) => void
  onError?: (error: Error) => void
}

const PaymentFormContent = ({ amount, onSuccess, onError }: PaymentFormProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Une erreur est survenue')
        return
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/success`,
        },
      })

      if (confirmError) {
        setError(confirmError.message || 'Une erreur est survenue')
      } else {
        onSuccess?.('success')
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue')
      onError?.(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <LazyPaymentElement />
      {error && <div className='text-red-500'>{error}</div>}
      <button
        type='submit'
        disabled={isLoading || !stripe}
        className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400'
      >
        {isLoading ? 'Paiement en cours...' : `Payer ${amount}€`}
      </button>
    </form>
  )
}

export const PaymentForm = ({ amount, onSuccess, onError }: PaymentFormProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount }),
        })

        const data = await response.json()
        setClientSecret(data.clientSecret)
      } catch (error) {
        onError?.(error as Error)
      }
    }

    createPaymentIntent()
  }, [amount, onError])

  if (!clientSecret) {
    return <div>Chargement...</div>
  }

  return (
    <LazyStripeElements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentFormContent amount={amount} onSuccess={onSuccess} onError={onError} />
    </LazyStripeElements>
  )
}
