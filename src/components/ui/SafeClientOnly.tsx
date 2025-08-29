'use client'

import { ReactNode, useEffect, useState } from 'react'

interface SafeClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function SafeClientOnly({ children, fallback }: SafeClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}