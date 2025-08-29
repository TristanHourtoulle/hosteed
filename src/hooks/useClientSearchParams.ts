'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export function useClientSearchParams() {
  const searchParams = useSearchParams()
  const [params, setParams] = useState<URLSearchParams | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setParams(searchParams)
  }, [searchParams])

  if (!isClient) {
    return null
  }

  return params
}