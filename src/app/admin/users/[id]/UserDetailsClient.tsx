'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/shadcnui/button'
import { ArrowLeft } from 'lucide-react'
import type { ExtendedUser } from './types'
import { LoadingDisplay } from './components/LoadingDisplay'
import { UserPersonalInfo } from './components/UserPersonalInfo'
import { UserListingsAndBookings } from './components/UserListingsAndBookings'

interface UserDetailsClientProps {
  initialData: ExtendedUser
}

export function UserDetailsClient({ initialData }: UserDetailsClientProps) {
  const { session, isLoading: isAuthLoading, isAuthenticated } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()
  const [user] = useState<ExtendedUser>(initialData)
  const [loading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || session.user.roles !== 'ADMIN')) {
      router.push('/')
      return
    }
  }, [isAuthenticated, session, router])

  if (isAuthLoading || loading) {
    return <LoadingDisplay />
  }

  if (!session) {
    return null
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      <div className='container mx-auto p-6 space-y-8'>
        <motion.div
          className='space-y-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header avec navigation */}
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-0'>
            <div>
              <h1 className='text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent'>
                Profil Utilisateur
              </h1>
              <p className='text-gray-600 mt-1'>
                Informations détaillées et activité de l&apos;utilisateur
              </p>
            </div>
            <Button
              variant='outline'
              asChild
              className='rounded-xl border-gray-200 hover:bg-gray-50'
            >
              <Link href='/admin/users' className='flex items-center gap-2'>
                <ArrowLeft className='h-4 w-4' />
                <span>Retour à la liste</span>
              </Link>
            </Button>
          </div>

          {/* Contenu principal */}
          <div className='grid grid-cols-1 xl:grid-cols-4 gap-8'>
            <div className='xl:col-span-1'>
              <UserPersonalInfo user={user} />
            </div>
            <div className='xl:col-span-3'>
              <UserListingsAndBookings
                userId={user.id}
                user={{
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.roles,
                }}
                posts={[]}
                bookings={[]}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
