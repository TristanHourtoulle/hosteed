'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Si nous sommes sur cette page, c'est que le paiement a réussi
    // car Stripe nous redirige ici uniquement en cas de succès
    setStatus('success');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        {status === 'loading' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Vérification du paiement...</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Paiement réussi !</h2>
            <p className="text-gray-600 mb-8">
              Merci pour votre paiement. Votre réservation a été confirmée.
            </p>
            <Link
              href="/reservations"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Retour à l'accueil
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur de paiement</h2>
            <p className="text-gray-600 mb-8">
              Une erreur est survenue lors du traitement de votre paiement.
            </p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Retour à l'accueil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
