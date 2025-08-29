'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { QueryProvider } from './query-provider'

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </SessionProvider>
  )
}