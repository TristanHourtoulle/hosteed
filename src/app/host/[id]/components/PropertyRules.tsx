interface Rules {
  smokingAllowed: boolean
  petsAllowed: boolean
  eventsAllowed: boolean
  checkInTime: string
  checkOutTime: string
  selfCheckIn: boolean
  selfCheckInType?: string
}

interface PropertyRulesProps {
  maxPeople?: number
  rules: Rules
}

export default function PropertyRules({ maxPeople, rules }: PropertyRulesProps) {
  // Ne pas afficher la section si pas de données valides (valeurs par défaut)
  const hasValidRules = rules && (
    rules.checkInTime !== '15:00' || 
    rules.checkOutTime !== '11:00' ||
    rules.smokingAllowed ||
    rules.petsAllowed ||
    rules.eventsAllowed ||
    rules.selfCheckIn
  )

  // Si pas de maxPeople et pas de règles valides, ne rien afficher
  if (!maxPeople && !hasValidRules) return null

  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Règlement intérieur</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {hasValidRules && (
          <div>
            <h4 className='font-medium text-gray-900 mb-3'>Horaires</h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Arrivée</span>
                <span className='text-gray-900'>Après {rules.checkInTime}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Départ</span>
                <span className='text-gray-900'>Avant {rules.checkOutTime}</span>
              </div>
              {rules.selfCheckIn && (
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Arrivée autonome</span>
                  <span className='text-gray-900'>{rules.selfCheckInType}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {(maxPeople || hasValidRules) && (
          <div>
            <h4 className='font-medium text-gray-900 mb-3'>Pendant le séjour</h4>
            <ul className='space-y-1 text-sm text-gray-600'>
              {maxPeople && <li>• Maximum {maxPeople} voyageurs</li>}
              {hasValidRules && (
                <>
                  <li>• {rules.smokingAllowed ? 'Fumeur autorisé' : 'Interdiction de fumer'}</li>
                  <li>• {rules.petsAllowed ? 'Animaux autorisés' : 'Animaux non autorisés'}</li>
                  <li>
                    • {rules.eventsAllowed ? 'Événements autorisés' : "Pas de fêtes ou d'événements"}
                  </li>
                  <li>• Respecter le voisinage</li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
