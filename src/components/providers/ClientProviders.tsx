'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { QueryProvider } from './query-provider'
import { UserProfileProvider } from '@/contexts/UserProfileContext'

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <QueryProvider>
        <UserProfileProvider>
          {children}
        </UserProfileProvider>
      </QueryProvider>
    </SessionProvider>
  )
}