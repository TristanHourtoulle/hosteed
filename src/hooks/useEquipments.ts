import { useQuery } from '@tanstack/react-query'
import { CACHE_TAGS } from '@/lib/cache/query-client'
import {
  findAllEquipments,
  createEquipment,
  updateEquipment,
  deleteEquipement,
} from '@/lib/services/equipments.service'
import { useStaticDataMutation } from './useMutationWithCache'

// Hook pour récupérer tous les équipements
export function useEquipments() {
  return useQuery({
    queryKey: CACHE_TAGS.staticData.equipments,
    queryFn: findAllEquipments,
    staleTime: 1000 * 60 * 60 * 24, // 24 heures
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 jours
  })
}

// Hook pour créer un équipement avec invalidation automatique
export function useCreateEquipment() {
  return useStaticDataMutation(
    ({ name, icon }: { name: string; icon: string }) => createEquipment(name, icon),
    'equipments',
    {
      onSuccess: () => {
        // Le cache est déjà invalidé automatiquement
      },
    }
  )
}

// Hook pour modifier un équipement
export function useUpdateEquipment() {
  return useStaticDataMutation(
    ({ id, name, icon }: { id: string; name: string; icon: string }) =>
      updateEquipment(id, name, icon),
    'equipments'
  )
}

// Hook pour supprimer un équipement
export function useDeleteEquipment() {
  return useStaticDataMutation(({ id }: { id: string }) => deleteEquipement(id), 'equipments')
}

// Exemple d'utilisation dans un composant :
/*
function EquipmentManager() {
  const { data: equipments, isLoading } = useEquipments()
  const { mutate: createEquipment, isPending: isCreating } = useCreateEquipment()
  
  const handleCreate = () => {
    createEquipment({ 
      name: 'Nouveau équipement', 
      icon: 'icon.svg' 
    })
    // Le cache se mettra à jour automatiquement !
  }
  
  return (
    <div>
      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        equipments?.map(equipment => (
          <div key={equipment.id}>{equipment.name}</div>
        ))
      )}
      <button onClick={handleCreate} disabled={isCreating}>
        Créer équipement
      </button>
    </div>
  )
}
*/
