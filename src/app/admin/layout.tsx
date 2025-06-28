'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AdminNav } from './components/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  return (
    <div className='flex min-h-screen flex-col'>
      <AdminNav />
      <main className='flex-1'>{children}</main>
    </div>
  )
}
