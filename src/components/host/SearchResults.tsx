import ProductCard from '@/components/ui/ProductCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/shadcnui'
import { motion } from 'framer-motion'

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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function SearchResults({
  products,
  hasActiveFilters,
  onResetFilters,
}: SearchResultsProps) {
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardContent className='py-12 text-center'>
            <p className='text-gray-500'>Aucun hébergement trouvé avec ces critères</p>
            {hasActiveFilters && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
                <Button variant='outline' className='mt-4' onClick={onResetFilters}>
                  Réinitialiser les filtres
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial='hidden'
      animate='show'
      className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6'
    >
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </motion.div>
  )
}
