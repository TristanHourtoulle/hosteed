import ProductCard from '@/components/ui/ProductCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/shadcnui'

interface Product {
  id: string
  name: string
  description: string
  address: string
  longitude: number
  latitude: number
  img?: { img: string }[]
  basePrice: string
  equipments?: { id: string; name: string }[]
  servicesList?: { id: string; name: string }[]
  mealsList?: { id: string; name: string }[]
  securities?: { id: string; name: string }[]
  arriving: number
  leaving: number
  typeRentId?: string
  certified?: boolean
  validate?: string
}

interface SearchResultsProps {
  products: Product[]
  hasActiveFilters: boolean
  onResetFilters: () => void
}

export default function SearchResults({
  products,
  hasActiveFilters,
  onResetFilters,
}: SearchResultsProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className='py-12 text-center'>
          <p className='text-gray-500'>Aucun hébergement trouvé avec ces critères</p>
          {hasActiveFilters && (
            <Button variant='outline' className='mt-4' onClick={onResetFilters}>
              Réinitialiser les filtres
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6'>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
