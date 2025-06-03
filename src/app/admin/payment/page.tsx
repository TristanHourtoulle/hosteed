'use client';

import { useEffect, useState } from 'react';
import { getAllPaymentRequest, approvePaymentRequest } from '@/lib/services/payment.service';
import { PaymentStatus, PaymentMethod, PaymentReqStatus } from '@prisma/client';

interface PayRequest {
  id: string;
  userId: string;
  PaymentRequest: PaymentStatus;
  prices: string;
  notes: string;
  method: PaymentMethod;
  status: PaymentReqStatus;
}

export default function PaymentAdminPage() {
  const [payRequests, setPayRequests] = useState<PayRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchPayRequests();
  }, []);

  const fetchPayRequests = async () => {
    try {
      const { payRequest } = await getAllPaymentRequest();
      setPayRequests(payRequest);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes de paiement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setUpdating(id);
      await approvePaymentRequest(id);
      await fetchPayRequests();
    } catch (error) {
      console.error('Erreur lors de l\'approbation de la demande:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      SEPA_VIREMENT: 'Virement SEPA',
      TAPTAP: 'Taptap',
      PAYPAL: 'PayPal',
      INTERNATIONAL: 'Virement International',
      OTHER: 'Autre'
    };
    return labels[method] || method;
  };

  const getPaymentRequestLabel = (type: PaymentStatus) => {
    const labels: Partial<Record<PaymentStatus, string>> = {
      FULL_TRANSFER_REQ: 'Demande de paiement intégral',
      MID_TRANSFER_REQ: 'Demande de paiement de 50%',
      REST_TRANSFER_REQ: 'Demande du reste du paiement'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Demandes de paiement</h1>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type de demande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Méthode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPaymentRequestLabel(request.PaymentRequest)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Number(request.prices).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPaymentMethodLabel(request.method)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {request.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={updating === request.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {updating === request.id ? 'Traitement...' : 'Approuver'}
                      </button>
                    </td>
                  </tr>
                ))}
                {payRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucune demande de paiement en attente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
