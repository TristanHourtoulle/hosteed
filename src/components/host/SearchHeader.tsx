interface SearchHeaderProps {
  location: string
  featured: boolean
  popular: boolean
  recent: boolean
  promo: boolean
  selectedType: string
  typeRent: Array<{ id: string; name: string }>
  productsCount: number
}

export default function SearchHeader({
  location,
  featured,
  popular,
  recent,
  promo,
  selectedType,
  typeRent,
  productsCount,
}: SearchHeaderProps) {
  const getTitle = () => {
    if (location) {
      return `Résultats pour "${location}"`
    }
    if (featured) {
      return '⭐ Hébergements vedettes'
    }
    if (popular) {
      return '🔥 Hébergements populaires'
    }
    if (recent) {
      return '🆕 Hébergements récemment ajoutés'
    }
    if (promo) {
      return '💰 Offres spéciales'
    }
    if (selectedType) {
      return `${typeRent.find(t => t.id === selectedType)?.name || 'Hébergements'} disponibles`
    }
    return 'Tous les hébergements'
  }

  return (
    <div className='mb-6'>
      <h2 className='text-2xl font-bold text-gray-900'>{getTitle()}</h2>
      <p className='text-gray-600 mt-1'>
        {productsCount} {productsCount === 1 ? 'résultat trouvé' : 'résultats trouvés'}
      </p>
    </div>
  )
}
