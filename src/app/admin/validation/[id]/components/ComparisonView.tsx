'use client'

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  priceMGA?: string
  availableRooms?: number
  guest: number
  bedroom: number
  bed: number
  bathroom: number
  arriving: number
  leaving: number
  type?: { name: string; description: string }
  typeRoom?: { name: string; description: string }
  rules?: {
    smokingAllowed: boolean
    petsAllowed: boolean
    eventsAllowed: boolean
    checkInTime: string
    checkOutTime: string
    selfCheckIn: boolean
    selfCheckInType?: string
  }
  propertyInfo?: {
    hasStairs: boolean
    hasElevator: boolean
    hasHandicapAccess: boolean
    hasPetsOnProperty: boolean
    additionalNotes?: string
  }
}

interface ComparisonViewProps {
  draft: Product
  original: Product
}

interface DiffFieldProps {
  label: string
  draftValue: string | number | boolean | null | undefined
  originalValue: string | number | boolean | null | undefined
  isDifferent?: boolean
  formatter?: (value: string | number | boolean | null | undefined) => string
}

export function ComparisonView({ draft, original }: ComparisonViewProps) {
  const getFieldDiff = (draftValue: string | number | boolean | null | undefined, originalValue: string | number | boolean | null | undefined) => {
    const isDifferent = JSON.stringify(draftValue) !== JSON.stringify(originalValue)
    return {
      isDifferent,
      draftValue,
      originalValue,
    }
  }

  const DiffField = ({ 
    label, 
    draftValue, 
    originalValue, 
    isDifferent = false,
    formatter = (v: string | number | boolean | null | undefined) => String(v || 'Non défini') 
  }: DiffFieldProps) => (
    <div className={`p-4 rounded-lg border-l-4 ${isDifferent ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="font-medium text-sm text-gray-700 mb-2">{label}</div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Original</div>
          <div className={`text-sm ${isDifferent ? 'text-gray-600' : 'text-gray-800'}`}>
            {formatter(originalValue)}
          </div>
        </div>
        <div>
          <div className="text-xs text-green-600 mb-1">Modifié</div>
          <div className={`text-sm font-medium ${isDifferent ? 'text-green-700' : 'text-gray-800'}`}>
            {formatter(draftValue)}
          </div>
        </div>
      </div>
    </div>
  )

  const priceFormatter = (value: string | number | boolean | null | undefined) => value ? `${value}€` : 'Non défini'
  const booleanFormatter = (value: string | number | boolean | null | undefined) => value === true ? 'Oui' : value === false ? 'Non' : 'Non défini'
  const numberFormatter = (value: string | number | boolean | null | undefined) => String(value || 0)

  const differences: { label: string; diff: { isDifferent: boolean; draftValue: string | number | boolean | null | undefined; originalValue: string | number | boolean | null | undefined }; formatter?: (v: string | number | boolean | null | undefined) => string }[] = []

  // Check simple field differences
  if (draft.name !== original.name) {
    const diff = getFieldDiff(draft.name, original.name)
    differences.push({ label: "Nom de l'hébergement", diff })
  }

  if (draft.description !== original.description) {
    const diff = getFieldDiff(draft.description, original.description)
    differences.push({ label: 'Description', diff })
  }

  if (draft.address !== original.address) {
    const diff = getFieldDiff(draft.address, original.address)
    differences.push({ label: 'Adresse', diff })
  }

  if (draft.basePrice !== original.basePrice) {
    const diff = getFieldDiff(draft.basePrice, original.basePrice)
    differences.push({ label: 'Prix par nuit (EUR)', diff, formatter: priceFormatter })
  }

  if (draft.priceMGA !== original.priceMGA) {
    const diff = getFieldDiff(draft.priceMGA, original.priceMGA)
    differences.push({ 
      label: 'Prix par nuit (MGA)', 
      diff, 
      formatter: (v: string | number | boolean | null | undefined) => v ? `${v} Ariary` : 'Non défini' 
    })
  }

  if (draft.availableRooms !== original.availableRooms) {
    const diff = getFieldDiff(draft.availableRooms, original.availableRooms)
    differences.push({ label: 'Nombre de chambres disponibles (Hôtel)', diff, formatter: numberFormatter })
  }

  if (draft.guest !== original.guest) {
    const diff = getFieldDiff(draft.guest, original.guest)
    differences.push({ label: 'Nombre d\'invités', diff, formatter: numberFormatter })
  }

  if (draft.bedroom !== original.bedroom) {
    const diff = getFieldDiff(draft.bedroom, original.bedroom)
    differences.push({ label: 'Nombre de chambres', diff, formatter: numberFormatter })
  }

  if (draft.bed !== original.bed) {
    const diff = getFieldDiff(draft.bed, original.bed)
    differences.push({ label: 'Nombre de lits', diff, formatter: numberFormatter })
  }

  if (draft.bathroom !== original.bathroom) {
    const diff = getFieldDiff(draft.bathroom, original.bathroom)
    differences.push({ label: 'Nombre de salles de bain', diff, formatter: numberFormatter })
  }

  if (draft.arriving !== original.arriving) {
    const diff = getFieldDiff(draft.arriving, original.arriving)
    differences.push({ 
      label: 'Heure d\'arrivée', 
      diff, 
      formatter: (v: string | number | boolean | null | undefined) => v ? `${v}h` : 'Non défini' 
    })
  }

  if (draft.leaving !== original.leaving) {
    const diff = getFieldDiff(draft.leaving, original.leaving)
    differences.push({ 
      label: 'Heure de départ', 
      diff, 
      formatter: (v: string | number | boolean | null | undefined) => v ? `${v}h` : 'Non défini' 
    })
  }

  // Check nested objects
  if (draft.type?.name !== original.type?.name) {
    const diff = getFieldDiff(draft.type?.name, original.type?.name)
    differences.push({
      label: 'Type d\'hébergement',
      diff
    })
  }

  if (draft.typeRoom?.name !== original.typeRoom?.name) {
    const diff = getFieldDiff(draft.typeRoom?.name, original.typeRoom?.name)
    differences.push({
      label: 'Type de chambre',
      diff
    })
  }

  // Check rules
  if (draft.rules && original.rules) {
    const ruleFields = [
      { key: 'smokingAllowed', label: 'Fumeur autorisé', formatter: booleanFormatter },
      { key: 'petsAllowed', label: 'Animaux autorisés', formatter: booleanFormatter },
      { key: 'eventsAllowed', label: 'Événements autorisés', formatter: booleanFormatter },
      { key: 'selfCheckIn', label: 'Arrivée autonome', formatter: booleanFormatter },
      { key: 'checkInTime', label: 'Heure d\'arrivée' },
      { key: 'checkOutTime', label: 'Heure de départ' },
      { key: 'selfCheckInType', label: 'Type d\'arrivée autonome' },
    ]

    ruleFields.forEach(ruleField => {
      const draftValue = draft.rules?.[ruleField.key as keyof typeof draft.rules]
      const originalValue = original.rules?.[ruleField.key as keyof typeof original.rules]
      const diff = getFieldDiff(draftValue, originalValue)
      
      if (diff.isDifferent) {
        differences.push({
          label: ruleField.label,
          diff,
          formatter: ruleField.formatter
        })
      }
    })
  }

  // Check property info
  if (draft.propertyInfo && original.propertyInfo) {
    const propertyFields = [
      { key: 'hasStairs', label: 'Escaliers', formatter: booleanFormatter },
      { key: 'hasElevator', label: 'Ascenseur', formatter: booleanFormatter },
      { key: 'hasHandicapAccess', label: 'Accès handicapé', formatter: booleanFormatter },
      { key: 'hasPetsOnProperty', label: 'Animaux sur la propriété', formatter: booleanFormatter },
      { key: 'additionalNotes', label: 'Notes supplémentaires' },
    ]

    propertyFields.forEach(propertyField => {
      const draftValue = draft.propertyInfo?.[propertyField.key as keyof typeof draft.propertyInfo]
      const originalValue = original.propertyInfo?.[propertyField.key as keyof typeof original.propertyInfo]
      const diff = getFieldDiff(draftValue, originalValue)
      
      if (diff.isDifferent) {
        differences.push({
          label: propertyField.label,
          diff,
          formatter: propertyField.formatter
        })
      }
    })
  }

  if (differences.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Aucune modification détectée</h3>
          <p className="text-sm text-blue-700">
            Aucune différence n&apos;a été trouvée entre l&apos;annonce originale et la version modifiée.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Comparaison des modifications</h3>
        <p className="text-sm text-blue-700">
          Voici les {differences.length} différence(s) détectée(s) entre l&apos;annonce originale et les modifications proposées.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Modifications détectées ({differences.length})</h4>
        
        {differences.map((item, index) => (
          <DiffField
            key={index}
            label={item.label}
            draftValue={item.diff.draftValue}
            originalValue={item.diff.originalValue}
            isDifferent={item.diff.isDifferent}
            formatter={item.formatter}
          />
        ))}
      </div>
    </div>
  )
}