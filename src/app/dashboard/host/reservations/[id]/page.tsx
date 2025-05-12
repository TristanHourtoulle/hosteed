'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { getRentById, changeRentStatus } from '@/lib/services/rents.service';
import { RentStatus } from '@prisma/client';
import HostNavbar from '../../components/HostNavbar';
import { useRouter } from 'next/navigation';

interface Rent {
  id: string;
  arrivingDate: Date;
  leavingDate: Date;
  status: RentStatus;
  product: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function RentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [rent, setRent] = useState<Rent | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const resolvedParams = use(params);

  useEffect(() => {
    const fetchRent = async () => {
      try {
        if (session?.user?.id) {
          const data = await getRentById(resolvedParams.id);
          if (data) {
            setRent(data);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la location:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchRent();
    }
  }, [session, resolvedParams.id]);

  const handleStatusChange = async (newStatus: RentStatus) => {
    try {
      setUpdating(true);
      await changeRentStatus(resolvedParams.id, newStatus);
      // Rafraîchir les données
      const updatedRent = await getRentById(resolvedParams.id);
      if (updatedRent) {
        setRent(updatedRent);
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: RentStatus) => {
    const statusConfig = {
      RESERVED: { label: 'Réservée', color: 'bg-yellow-100 text-yellow-800' },
      CHECKIN: { label: 'En cours', color: 'bg-green-100 text-green-800' },
      CHECKOUT: { label: 'Terminée', color: 'bg-gray-100 text-gray-800' },
      CANCEL: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: 'Inconnu', color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-sm ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <HostNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!rent) {
    return (
      <div className="min-h-screen bg-gray-100">
        <HostNavbar />
        <div className="container mx-auto py-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-500">Location non trouvée</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <HostNavbar />
      <div className="container mx-auto py-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Détails de la location</h1>
              <div className="flex items-center gap-4">
                {rent.status === RentStatus.RESERVED && (
                  <button
                    onClick={() => handleStatusChange(RentStatus.CHECKIN)}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Mise à jour...' : 'Marquer comme arrivé'}
                  </button>
                )}
                {rent.status === RentStatus.CHECKIN && (
                  <button
                    onClick={() => handleStatusChange(RentStatus.CHECKOUT)}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Mise à jour...' : 'Marquer comme terminé'}
                  </button>
                )}
                {getStatusBadge(rent.status)}
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de la location</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Produit</p>
                    <p className="text-gray-900">{rent.product?.name || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="text-gray-900">{rent.user?.name || 'Non spécifié'}</p>
                    <p className="text-sm text-gray-500">{rent.user?.email || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date d'arrivée</p>
                    <p className="text-gray-900">{rent.arrivingDate ? formatDate(rent.arrivingDate) : 'Non spécifiée'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date de départ</p>
                    <p className="text-gray-900">{rent.leavingDate ? formatDate(rent.leavingDate) : 'Non spécifiée'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 