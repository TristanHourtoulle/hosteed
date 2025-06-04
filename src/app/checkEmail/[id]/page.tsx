'use client'

import { useEffect, useState, use } from 'react'
import { validateEmail } from '@/lib/services/user.service'
import { useRouter } from 'next/navigation'

export default function CheckEmailPage({ params }: { params: Promise<{ id: string }> }) {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')
    const router = useRouter()
    const resolvedParams = use(params)

    useEffect(() => {
        const validateToken = async () => {
            try {
                const result = await validateEmail(resolvedParams.id)
                if (result) {
                    setStatus('success')
                    setMessage('Votre email a été validé avec succès ! Vous allez être redirigé vers la page de connexion.')
                    setTimeout(() => {
                        router.push('/login')
                    }, 3000)
                } else {
                    setStatus('error')
                    setMessage('Le lien de validation est invalide ou a expiré. Un nouvel email de vérification a été envoyé.')
                }
            } catch (error) {
                console.error(error)
                setStatus('error')
                setMessage('Une erreur est survenue lors de la validation de votre email.')
            }
        }

        validateToken()
    }, [resolvedParams.id, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Validation de l&apos;email
                    </h2>
                    {status === 'loading' && (
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Vérification de votre email en cours...
                        </p>
                    )}
                </div>
                <div className="mt-8 space-y-6">
                    {status === 'loading' && (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                    {status !== 'loading' && (
                        <p className={`text-center text-sm ${
                            status === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
