'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/shadcnui/skeleton'

/**
 * ProductCardSkeleton - Phase 5 UX Optimizations
 * Skeleton réaliste qui reproduit fidèlement la structure du ProductCard
 * Améliore la performance perçue de +40% selon PERFORMANCE_ROADMAP.md
 */

interface ProductCardSkeletonProps {
  /**
   * Animation delay pour créer un effet d'apparition progressive
   * Recommandé: index * 0.1 pour une grille de cartes
   */
  delay?: number
  /**
   * Désactive les animations pour les tests ou préférences utilisateur
   */
  disableAnimation?: boolean
}

const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  delay = 0,
  disableAnimation = false,
}) => {
  const shouldAnimate = !disableAnimation

  // Animations configurées pour correspondre au ProductCard réel
  const cardMotionProps = shouldAnimate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.5,
          delay: delay,
        },
      }
    : {}

  return (
    <motion.div {...cardMotionProps}>
      <div className='bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100'>
        {/* Section Image - Aspect ratio 4/3 comme ProductCard */}
        <div className='relative aspect-[4/3] w-full'>
          {/* Image placeholder principale */}
          <Skeleton className='w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200' />
          
          {/* Badge Sponsorisé placeholder - Top left */}
          <div className='absolute top-3 left-3 z-10'>
            <Skeleton className='h-6 w-20 rounded-full bg-gradient-to-r from-gray-300 to-gray-200' />
          </div>
          
          {/* Bouton favoris placeholder - Top right */}
          <div className='absolute top-3 right-3 z-10'>
            <Skeleton className='h-8 w-8 rounded-full bg-white/80' />
          </div>
          
          {/* Rating placeholder - Top left, par-dessus sponsored */}
          <div className='absolute top-3 left-3 z-20 mt-8'>
            <Skeleton className='h-7 w-24 rounded-lg bg-black/20' />
          </div>
          
          {/* Image dots placeholder - Bottom center */}
          <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5'>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton 
                key={index} 
                className='h-2 w-2 rounded-full bg-white/60' 
              />
            ))}
          </div>
          
          {/* Navigation arrows placeholder - Sides, only visible on hover simulation */}
          <div className='absolute left-3 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity'>
            <Skeleton className='h-8 w-8 rounded-full bg-white/80' />
          </div>
          <div className='absolute right-3 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity'>
            <Skeleton className='h-8 w-8 rounded-full bg-white/80' />
          </div>
        </div>

        {/* Section Contenu - Padding 4 comme ProductCard */}
        <div className='p-4 space-y-2'>
          {/* Titre et sous-titre */}
          <div className='space-y-1'>
            {/* Titre principal (ville) */}
            <Skeleton className='h-5 w-3/4 bg-gray-200' />
            
            {/* Sous-titre (nom propriété) */}
            <Skeleton className='h-4 w-full bg-gray-150' />
          </div>
          
          {/* Section prix et badges */}
          <div className='flex items-center justify-between pt-1'>
            <div className='flex flex-col gap-1'>
              {/* Prix principal */}
              <div className='flex items-baseline gap-1'>
                <Skeleton className='h-6 w-16 bg-gray-200' />
                <Skeleton className='h-4 w-10 bg-gray-150' />
              </div>
              
              {/* Prix spécial placeholder (20% de chance d'apparaître) */}
              {Math.random() > 0.8 && (
                <div className='bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-lg px-2 py-1'>
                  <div className='flex items-center gap-1'>
                    <Skeleton className='h-3 w-16 bg-orange-200' />
                    <Skeleton className='h-3 w-12 bg-orange-150' />
                  </div>
                </div>
              )}
            </div>
            
            {/* Badge "Certifié" placeholder (30% de chance d'apparaître) */}
            {Math.random() > 0.7 && (
              <Skeleton className='h-6 w-16 rounded-full bg-green-100' />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * ProductGridSkeleton - Grille de 9 cartes skeleton comme recommandé Phase 5
 * Utilisé pendant le chargement des listes de produits
 */
interface ProductGridSkeletonProps {
  /**
   * Nombre de cartes skeleton à afficher
   * Défaut: 9 (grille 3x3 recommandée Phase 5)
   */
  count?: number
  /**
   * Layout de la grille responsive
   */
  gridClassName?: string
  /**
   * Désactive les animations pour tous les skeletons
   */
  disableAnimation?: boolean
}

const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({
  count = 9,
  gridClassName = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6',
  disableAnimation = false,
}) => {
  return (
    <div className={gridClassName}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton
          key={`skeleton-${index}`}
          delay={disableAnimation ? 0 : index * 0.1}
          disableAnimation={disableAnimation}
        />
      ))}
    </div>
  )
}

/**
 * Hook pour gérer l'état de chargement avec skeleton
 * Utilitaire Phase 5 pour intégration facile
 */
export const useSkeletonState = (isLoading: boolean, minimumDisplayTime = 800) => {
  const [showSkeleton, setShowSkeleton] = React.useState(isLoading)

  React.useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true)
    } else {
      // Garde le skeleton visible pendant un temps minimum pour éviter les flashs
      const timer = setTimeout(() => {
        setShowSkeleton(false)
      }, minimumDisplayTime)

      return () => clearTimeout(timer)
    }
  }, [isLoading, minimumDisplayTime])

  return showSkeleton
}

export { ProductCardSkeleton, ProductGridSkeleton }
export default ProductCardSkeleton