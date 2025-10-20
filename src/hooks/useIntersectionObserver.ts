'use client'

import { useEffect, useRef, useState, RefObject } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | Document | null
  rootMargin?: string
  freezeOnceVisible?: boolean
}

interface UseIntersectionObserverReturn {
  isIntersecting: boolean
  entry: IntersectionObserverEntry | undefined
}

/**
 * Hook optimisé pour l'observation d'intersection - Phase 5 UX Optimizations
 * Détecte quand un élément entre dans le viewport pour le lazy loading
 *
 * @param options Configuration de l'Intersection Observer
 * @returns Object avec isIntersecting status et entry détails
 */
export function useIntersectionObserver<T extends Element = Element>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T>, UseIntersectionObserverReturn] {
  const {
    threshold = 0.1, // 10% visible par défaut - optimisé pour la Phase 5
    root = null,
    rootMargin = '50px', // Préchargement 50px avant d'être visible
    freezeOnceVisible = false,
  } = options

  const elementRef = useRef<T>(null)
  const [entry, setEntry] = useState<IntersectionObserverEntry>()
  const [isIntersecting, setIsIntersecting] = useState(false)

  const frozen = entry?.isIntersecting && freezeOnceVisible

  useEffect(() => {
    const element = elementRef.current
    const hasIOSupport = !!window.IntersectionObserver

    if (!hasIOSupport || frozen || !element) {
      return
    }

    const observerParams = { threshold, root, rootMargin }
    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry)
      setIsIntersecting(entry.isIntersecting)
    }, observerParams)

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, root, rootMargin, frozen])

  return [elementRef as RefObject<T>, { isIntersecting, entry }]
}

/**
 * Hook pour observer plusieurs éléments simultanément
 * Optimisé pour les listes de produits - Virtual Scrolling Phase 5
 */
export function useMultipleIntersectionObserver<T extends Element = Element>(
  options: UseIntersectionObserverOptions = {}
): {
  observe: (element: T, id: string) => void
  unobserve: (id: string) => void
  intersecting: Set<string>
  entries: Map<string, IntersectionObserverEntry>
} {
  const { threshold = 0.1, root = null, rootMargin = '50px' } = options

  const [intersecting, setIntersecting] = useState<Set<string>>(new Set())
  const [entries, setEntries] = useState<Map<string, IntersectionObserverEntry>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementsMapRef = useRef<Map<Element, string>>(new Map())

  useEffect(() => {
    const hasIOSupport = !!window.IntersectionObserver
    if (!hasIOSupport) return

    observerRef.current = new IntersectionObserver(
      observerEntries => {
        observerEntries.forEach(entry => {
          const id = elementsMapRef.current.get(entry.target)
          if (!id) return

          setEntries(prev => new Map(prev.set(id, entry)))
          setIntersecting(prev => {
            const newSet = new Set(prev)
            if (entry.isIntersecting) {
              newSet.add(id)
            } else {
              newSet.delete(id)
            }
            return newSet
          })
        })
      },
      { threshold, root, rootMargin }
    )

    return () => {
      observerRef.current?.disconnect()
    }
  }, [threshold, root, rootMargin])

  const observe = (element: T, id: string) => {
    if (!observerRef.current) return

    elementsMapRef.current.set(element, id)
    observerRef.current.observe(element)
  }

  const unobserve = (id: string) => {
    if (!observerRef.current) return

    // Trouve l'élément par son ID et le désabonne
    for (const [element, elementId] of elementsMapRef.current.entries()) {
      if (elementId === id) {
        observerRef.current.unobserve(element)
        elementsMapRef.current.delete(element)
        break
      }
    }

    setIntersecting(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })

    setEntries(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }

  return { observe, unobserve, intersecting, entries }
}

/**
 * Hook spécialisé pour le lazy loading d'images - Phase 5 UX
 * Optimisé pour ProductCard et galleries d'images
 */
export function useLazyImageLoading<T extends Element = HTMLImageElement>(
  options: UseIntersectionObserverOptions & {
    onVisible?: () => void
    preloadMargin?: string
  } = {}
) {
  const { onVisible, preloadMargin = '100px', ...observerOptions } = options

  const [ref, { isIntersecting }] = useIntersectionObserver<T>({
    rootMargin: preloadMargin,
    freezeOnceVisible: true,
    ...observerOptions,
  })

  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (isIntersecting && !loaded && !error) {
      onVisible?.()
    }
  }, [isIntersecting, loaded, error, onVisible])

  const handleLoad = () => setLoaded(true)
  const handleError = () => setError(true)

  return {
    ref,
    isVisible: isIntersecting,
    loaded,
    error,
    handleLoad,
    handleError,
    shouldLoad: isIntersecting,
  }
}
