'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion, Variants } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { isFullAdmin } from '@/hooks/useAdminAuth'
import { Shield } from 'lucide-react'
import type { ExtendedUser } from './types'
import { LoadingDisplay } from './components/LoadingDisplay'
import { UserPersonalInfo } from './components/UserPersonalInfo'
import { UserListingsAndBookings } from './components/UserListingsAndBookings'
import { PageHeader } from '@/components/admin/ui/PageHeader'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'tween', duration: 0.4, ease: 'easeOut' },
  },
}

interface UserDetailsClientProps {
  initialData: ExtendedUser
}

export function UserDetailsClient({ initialData }: UserDetailsClientProps) {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isFullAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  if (isAuthLoading) {
    return <LoadingDisplay />
  }

  if (!session) {
    return null
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
      <motion.div
        className='mx-auto max-w-7xl space-y-8 p-6'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            backHref='/admin/users'
            backLabel='Retour à la liste'
            eyebrow='Espace administrateur'
            eyebrowIcon={Shield}
            title='Profil utilisateur'
            subtitle='Informations détaillées, annonces et réservations de cet utilisateur.'
          />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className='grid gap-6 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]'
        >
          <div>
            <UserPersonalInfo user={initialData} />
          </div>
          <div>
            <UserListingsAndBookings user={initialData} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
