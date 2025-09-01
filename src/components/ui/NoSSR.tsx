'use client'

import { ReactNode, useEffect, useState } from 'react'

interface NoSSRProps {
  children: ReactNode
  fallback?: ReactNode
}

export function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <>{fallback}</>
  }

  return <>{children}</>
}