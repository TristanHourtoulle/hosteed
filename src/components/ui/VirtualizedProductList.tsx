'use client'

import React, { useMemo } from 'react'
// Temporarily commented out for build compatibility
// import { FixedSizeGrid, FixedSizeList } from 'react-window'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import ProductCard from '@/components/ui/ProductCard'
import { ProductGridSkeleton } from '@/components/ui/ProductCardSkeleton'

/**
 * VirtualizedProductList - Phase 5 UX Optimizations
 * Virtual scrolling pour longues listes de produits
 * Configuration: 600px height, 120px item size (PERFORMANCE_ROADMAP.md)
 */

interface Product {
  id: string
  name: string
  description: string
  address: string
  img?: { img: string }[] | null
  basePrice: string
  originalBasePrice?: string
  specialPriceApplied?: boolean
  specialPriceInfo?: {
    pricesMga: string
    pricesEuro: string
    day: string[]
    startDate: Date | null
    endDate: Date | null
  }
  certified?: boolean
  reviews?: Array<{
    grade: number
    welcomeGrade: number
    staff: number
    comfort: number
    equipment: number
    cleaning: number
  }>
  PromotedProduct?: Array<{
    id: string
    active: boolean
    start: Date
    end: Date
  }>
}

interface VirtualizedProductListProps {
  products: Product[]
  isLoading: boolean
  hasNextPage?: boolean
  loadNextPage?: () => void
  /**
   * Configuration du viewport virtuel
   */
  height?: number
  width?: string | number
  /**
   * Configuration de la grille
   */
  columnCount?: number
  columnWidth?: number
  rowHeight?: number
  /**
   * Configuration responsive
   */
  responsive?: {
    sm: { columnCount: number; columnWidth: number }
    md: { columnCount: number; columnWidth: number }
    lg: { columnCount: number; columnWidth: number }
    xl: { columnCount: number; columnWidth: number }
  }
  /**
   * Callback pour le lazy loading
   */
  onItemVisible?: (index: number) => void
}

/**
 * Item component pour la virtualisation - optimisé pour ProductCard
 */
interface GridItemProps {
  columnIndex: number
  rowIndex: number
  style: React.CSSProperties
  data: {
    products: Product[]
    columnCount: number
    onItemVisible?: (index: number) => void
  }
}

// GridItem is reserved for future virtualization implementation
/* const GridItemComponent: React.FC<GridItemProps> = ({ columnIndex, rowIndex, style, data }) => {
  const { products, columnCount, onItemVisible } = data
  const index = rowIndex * columnCount + columnIndex
  const product = products[index]
  
  // Intersection observer pour détecter la visibilité
  const [ref, { isIntersecting }] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    freezeOnceVisible: true,
  })

  React.useEffect(() => {
    if (isIntersecting && onItemVisible) {
      onItemVisible(index)
    }
  }, [isIntersecting, index, onItemVisible])

  if (!product) {
    return <div style={style} />
  }

  return (
    <div ref={ref} style={style}>
      <div className='p-2'>
        <ProductCard product={product} index={index} />
      </div>
    </div>
  )
} */

/**
 * Hook pour calculer les dimensions responsive
 */
const useResponsiveDimensions = (containerWidth: number = 1200) => {
  return useMemo(() => {
    if (containerWidth < 640) {
      // Mobile: 1 colonne
      return { columnCount: 1, columnWidth: containerWidth }
    } else if (containerWidth < 768) {
      // Tablet: 2 colonnes
      return { columnCount: 2, columnWidth: containerWidth / 2 }
    } else if (containerWidth < 1280) {
      // Desktop: 3 colonnes
      return { columnCount: 3, columnWidth: containerWidth / 3 }
    } else {
      // Large: 4 colonnes
      return { columnCount: 4, columnWidth: containerWidth / 4 }
    }
  }, [containerWidth])
}

/**
 * VirtualizedProductGrid - Grille virtualisée optimisée
 */
const VirtualizedProductGrid: React.FC<VirtualizedProductListProps> = ({
  products,
  isLoading,
  hasNextPage = false,
  loadNextPage,
  height = 600, // Configuration Phase 5
  width = '100%',
  columnCount: forcedColumnCount,
  columnWidth: forcedColumnWidth,
  rowHeight: _rowHeight = 380, // Hauteur optimisée pour ProductCard (reserved for future virtualization)
  onItemVisible,
}) => {
  const [containerRef, { isIntersecting: isNearEnd }] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '200px', // Déclenche le chargement 200px avant la fin
  })

  // Calcul responsive des dimensions
  const dimensions = useResponsiveDimensions(
    typeof width === 'number' ? width : 1200
  )

  const columnCount = forcedColumnCount || dimensions.columnCount
  const _columnWidth = forcedColumnWidth || dimensions.columnWidth
  const rowCount = Math.ceil(products.length / columnCount)

  // Données pour les items de la grille (reserved for future virtualization)
  const _itemData = useMemo(() => ({
    products,
    columnCount,
    onItemVisible,
  }), [products, columnCount, onItemVisible])

  // Charge la page suivante quand on approche de la fin
  React.useEffect(() => {
    if (isNearEnd && hasNextPage && loadNextPage && !isLoading) {
      loadNextPage()
    }
  }, [isNearEnd, hasNextPage, loadNextPage, isLoading])

  if (isLoading && products.length === 0) {
    return (
      <div className='w-full'>
        <ProductGridSkeleton count={columnCount * 3} />
      </div>
    )
  }

  return (
    <div className='w-full'>
      {/* Grille virtualisée - Temporarily disabled for build compatibility */}
      <div 
        style={{ height, width }}
        className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
      >
        <div className="text-center p-8">
          <div className="text-lg font-semibold text-gray-600 mb-2">🚀 Virtual Grid</div>
          <p className="text-gray-500">
            Virtual scrolling will be fully implemented after package resolution
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Grid: {columnCount} columns × {rowCount} rows
          </p>
        </div>
      </div>
      
      {/* Indicateur de fin proche pour le chargement */}
      <div ref={containerRef} className='h-4' />
      
      {/* Skeleton pendant le chargement de nouvelles pages */}
      {isLoading && products.length > 0 && (
        <div className='mt-6'>
          <ProductGridSkeleton 
            count={columnCount * 2} 
            disableAnimation={true}
          />
        </div>
      )}
    </div>
  )
}

/**
 * VirtualizedProductList - Liste virtualisée simple (1 colonne)
 * Utile pour les vues mobiles ou les listes étroites
 */
interface ListItemProps {
  index: number
  style: React.CSSProperties
  data: {
    products: Product[]
    onItemVisible?: (index: number) => void
  }
}

// ListItem is reserved for future virtualization implementation
/* const ListItemComponent: React.FC<ListItemProps> = ({ index, style, data }) => {
  const { products, onItemVisible } = data
  const product = products[index]
  
  const [ref, { isIntersecting }] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    freezeOnceVisible: true,
  })

  React.useEffect(() => {
    if (isIntersecting && onItemVisible) {
      onItemVisible(index)
    }
  }, [isIntersecting, index, onItemVisible])

  if (!product) {
    return <div style={style} />
  }

  return (
    <div ref={ref} style={style}>
      <div className='px-4 py-2'>
        <ProductCard product={product} index={index} />
      </div>
    </div>
  )
} */

const VirtualizedProductList: React.FC<VirtualizedProductListProps> = ({
  products,
  isLoading,
  hasNextPage = false,
  loadNextPage,
  height = 600,
  width = '100%',
  rowHeight: _rowHeight2 = 380, // Reserved for future virtualization
  onItemVisible,
}) => {
  const [containerRef, { isIntersecting: isNearEnd }] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '200px',
  })

  const _itemData2 = useMemo(() => ({
    products,
    onItemVisible,
  }), [products, onItemVisible])

  React.useEffect(() => {
    if (isNearEnd && hasNextPage && loadNextPage && !isLoading) {
      loadNextPage()
    }
  }, [isNearEnd, hasNextPage, loadNextPage, isLoading])

  if (isLoading && products.length === 0) {
    return <ProductGridSkeleton count={6} gridClassName='space-y-4' />
  }

  return (
    <div className='w-full'>
      {/* Virtual List - Temporarily disabled for build compatibility */}
      <div 
        style={{ height, width }}
        className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
      >
        <div className="text-center p-8">
          <div className="text-lg font-semibold text-gray-600 mb-2">📋 Virtual List</div>
          <p className="text-gray-500">
            Virtual scrolling list will be fully implemented after package resolution
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Items: {products.length} products
          </p>
        </div>
      </div>
      
      <div ref={containerRef} className='h-4' />
      
      {isLoading && products.length > 0 && (
        <div className='mt-6'>
          <ProductGridSkeleton 
            count={3} 
            gridClassName='space-y-4'
            disableAnimation={true}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Hook utilitaire pour la virtualisation adaptative
 * Choisit automatiquement entre Grid et List selon la largeur d'écran
 */
const useAdaptiveVirtualization = (containerWidth: number) => {
  return useMemo(() => {
    if (containerWidth < 640) {
      return 'list' as const // Mobile: liste simple
    } else {
      return 'grid' as const // Desktop: grille
    }
  }, [containerWidth])
}

/**
 * Composant unifié qui choisit automatiquement entre Grid et List
 */
const AdaptiveVirtualizedProductList: React.FC<VirtualizedProductListProps & {
  forceMode?: 'grid' | 'list'
}> = ({ forceMode, ...props }) => {
  const [containerRef, setContainerRef] = React.useState<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = React.useState(1200)

  const adaptiveMode = useAdaptiveVirtualization(containerWidth)
  const mode = forceMode || adaptiveMode

  React.useEffect(() => {
    if (!containerRef) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(containerRef)
    return () => resizeObserver.disconnect()
  }, [containerRef])

  return (
    <div ref={setContainerRef} className='w-full'>
      {mode === 'grid' ? (
        <VirtualizedProductGrid {...props} width={containerWidth} />
      ) : (
        <VirtualizedProductList {...props} width={containerWidth} />
      )}
    </div>
  )
}

export {
  VirtualizedProductGrid,
  VirtualizedProductList,
  AdaptiveVirtualizedProductList,
  useAdaptiveVirtualization,
}

export default AdaptiveVirtualizedProductList