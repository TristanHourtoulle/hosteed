interface PropertyRulesProps {
  maxPeople?: number
}

export default function PropertyRules({ maxPeople }: PropertyRulesProps) {
  return (
    <div className='border-b border-gray-200 pb-8'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Règlement intérieur</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <h4 className='font-medium text-gray-900 mb-3'>Horaires</h4>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Arrivée</span>
              <span className='text-gray-900'>Après 15h00</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Départ</span>
              <span className='text-gray-900'>Avant 11h00</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Arrivée autonome</span>
              <span className='text-gray-900'>Boîte à clés</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className='font-medium text-gray-900 mb-3'>Pendant le séjour</h4>
          <ul className='space-y-1 text-sm text-gray-600'>
            <li>• Maximum {maxPeople || 8} voyageurs</li>
            <li>• Interdiction de fumer</li>
            <li>• Animaux non autorisés</li>
            <li>• Pas de fêtes ou d&apos;événements</li>
            <li>• Respecter le voisinage</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
